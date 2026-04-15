// canvasShareRoutes.js
// Mount in server.js:  import canvasShareRoutes from "./canvasShareRoutes.js";
//                      app.use("/api/canvas", canvasShareRoutes);
//
// Public endpoint — no requireAuth.  Anyone with the memoryId can read.

import express from "express";
import db from "./db.js";
import { generateSignedUrl } from "./r2.js";

const router = express.Router();

// ── helpers (mirrors canvasDbRoutes) ─────────────────────────────────────────
function parseMemoryId(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function safeParseCanvas(raw) {
  if (raw == null) return null;
  if (Buffer.isBuffer(raw)) raw = raw.toString("utf8");
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return null;
}

function safeParseJson(value, fallback) {
  if (value == null) return fallback;
  if (Buffer.isBuffer(value)) {
    try { return JSON.parse(value.toString("utf8")); } catch { return fallback; }
  }
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return fallback;
}

// ── GET /api/canvas/share/:memoryId  (public — no auth) ──────────────────────
// Returns the same shape as /api/canvas/load but adds `memoryTitle`.
router.get("/share/:memoryId", async (req, res) => {
  try {
    const memoryId = parseMemoryId(req.params.memoryId);
    if (!memoryId) return res.status(400).json({ error: "Invalid memoryId" });

    const [rows] = await db.execute(
      `
      SELECT
        m.title,
        JSON_EXTRACT(m.elements, '$.canvas') AS canvas,
        m.tags
      FROM memories m
      WHERE m.memory_id = ?
      LIMIT 1
      `,
      [memoryId],
    );

    if (!rows.length)
      return res.status(404).json({ error: "Memory not found", memoryId });

    const canvas      = safeParseCanvas(rows[0].canvas);
    const safeItems   = Array.isArray(canvas?.items) ? canvas.items : [];
    const safeCam     = canvas?.cam && typeof canvas.cam === "object" ? canvas.cam : { x: 0, y: 0 };
    const safeZoom    = canvas?.zoom      ?? 1;
    const safeBgColor = canvas?.bgColor   ?? "#ffffff";
    const safeBgPat   = canvas?.bgPattern ?? "blank";

    // tags
    const tagsRaw = safeParseJson(rows[0].tags, []);
    let tags = [];
    if (Array.isArray(tagsRaw)) {
      tags = tagsRaw;
    } else if (tagsRaw && typeof tagsRaw === "object") {
      tags = [
        ...(Array.isArray(tagsRaw.main)  ? tagsRaw.main  : []),
        ...(Array.isArray(tagsRaw.sub)   ? tagsRaw.sub   : []),
        ...(Array.isArray(tagsRaw.third) ? tagsRaw.third : []),
      ];
    }
    tags = [...new Set(tags.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim()))];


const isPreview = req.query.preview === "true";
if (!isPreview) {
  for (const item of safeItems) {
    if (item?.imageKey && typeof item.imageKey === "string") {
      item.imageUrl = await generateSignedUrl(item.imageKey);
    }
  }
}

    // deezer defaults
    for (const item of safeItems) {
      if (item?.type === "deezer") {
        item.frame      = item.frame      ?? "none";
        item.fontFamily = item.fontFamily ?? "Arial";
        item.fontColor  = item.fontColor  ?? "#000000";
      }
    }

    res.json({
      memoryId,
      memoryTitle: rows[0].title ?? "Untitled",
      items:      safeItems,
      cam:        safeCam,
      zoom:       safeZoom,
      bgColor:    safeBgColor,
      bgPattern:  safeBgPat,
      tags,
      updatedAt:  canvas?.updatedAt ?? null,
    });
  } catch (err) {
    console.error("canvas share load error:", err);
    res.status(500).json({ error: "Failed to load shared canvas", details: err?.message ?? String(err) });
  }
});

export default router;
