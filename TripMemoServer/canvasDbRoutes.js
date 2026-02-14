// canvasDbRoutes.js
import express from "express";
import db from "./db.js";

const router = express.Router();

// Helper: normalize memoryId
function parseMemoryId(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Helper: parse canvas from mysql safely
function safeParseCanvas(raw) {
  if (raw == null) return null;

  // mysql2 can return Buffer sometimes
  if (Buffer.isBuffer(raw)) {
    raw = raw.toString("utf8");
  }

  // if it's already an object, return it
  if (typeof raw === "object") return raw;

  // if it's a string, try parse
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  return null;
}

// POST /api/canvas/save
router.post("/save", async (req, res) => {
  try {
    const memoryId = parseMemoryId(req.body?.memoryId);
    const items = req.body?.items ?? [];
    const cam = req.body?.cam ?? { x: 0, y: 0 };

    if (!memoryId) {
      return res.status(400).json({ error: "memoryId required (number > 0)" });
    }

    // basic shape validation (prevents storing junk)
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items must be an array" });
    }
    if (typeof cam !== "object" || cam == null) {
      return res.status(400).json({ error: "cam must be an object" });
    }

    const canvasObj = { items, cam, updatedAt: Date.now() };
    const canvasJson = JSON.stringify(canvasObj);

   const [result] = await db.execute(
  `
  UPDATE memories
  SET elements = JSON_SET(
    IF(JSON_TYPE(elements) = 'OBJECT', elements, JSON_OBJECT()),
    '$.canvas',
    CAST(? AS JSON)
  )
  WHERE memory_id = ?
  `,
  [canvasJson, memoryId]
);


    // if memory_id doesn't exist
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Memory not found", memoryId });
    }

    res.json({ ok: true, memoryId });
  } catch (err) {
    // Log full error server-side
    console.error("canvas save error:", err);

    // Return safe message to client
    res.status(500).json({
      error: "Failed to save canvas",
      details: err?.message ?? String(err),
    });
  }
});

// GET /api/canvas/load?memoryId=123
router.get("/load", async (req, res) => {
  try {
    const memoryId = parseMemoryId(req.query?.memoryId);

    if (!memoryId) {
      return res.status(400).json({ error: "memoryId required (number > 0)" });
    }

    const [rows] = await db.execute(
      `
      SELECT JSON_EXTRACT(elements, '$.canvas') AS canvas
      FROM memories
      WHERE memory_id = ?
      LIMIT 1
      `,
      [memoryId],
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Memory not found", memoryId });
    }

    const canvas = safeParseCanvas(rows[0].canvas);

    // if no canvas stored OR stored JSON is broken
    if (!canvas) {
      return res.json({ items: [], cam: { x: 0, y: 0 } });
    }

    // extra safety: ensure shape
    res.json({
      items: Array.isArray(canvas.items) ? canvas.items : [],
      cam: typeof canvas.cam === "object" && canvas.cam ? canvas.cam : { x: 0, y: 0 },
      updatedAt: canvas.updatedAt ?? null,
    });
  } catch (err) {
    console.error("canvas load error:", err);
    res.status(500).json({
      error: "Failed to load canvas",
      details: err?.message ?? String(err),
    });
  }
});

export default router;
