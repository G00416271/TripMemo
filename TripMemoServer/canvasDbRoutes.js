// canvasDbRoutes.js
import express from "express";
import db from "./db.js";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { uploadToR2, generateSignedUrl } from "./r2.js";

function extFromMime(mime) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return "";
}


const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Helper: normalize memoryId
function parseMemoryId(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Helper: parse JSON safely (string/object)
function safeParseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

// Helper: parse canvas from mysql safely
function safeParseCanvas(raw) {
  if (raw == null) return null;
  if (Buffer.isBuffer(raw)) raw = raw.toString("utf8");
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * POST /api/canvas/save
 * multipart/form-data fields:
 * - memoryId: number
 * - items: JSON string (array)
 * - cam: JSON string (object)
 * - images: files[] (optional)
 *
 * IMPORTANT: each item that needs an uploaded image must have:
 * - item.clientImageId (string)
 *
 * and each uploaded file must be sent with its "originalname" set to that clientImageId
 * OR you can send a parallel array of ids (see notes below).
 */
router.post("/save", upload.array("images"), async (req, res) => {
  try {
    const memoryId = parseMemoryId(req.body?.memoryId);

    // items/cam come as strings in multipart
    const items = safeParseJson(req.body?.items, []);
    const cam = safeParseJson(req.body?.cam, { x: 0, y: 0 });

    if (!memoryId) {
      return res.status(400).json({ error: "memoryId required (number > 0)" });
    }
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items must be an array" });
    }
    if (typeof cam !== "object" || cam == null) {
      return res.status(400).json({ error: "cam must be an object" });
    }

    // Upload images (if provided) and map them back onto items
    // Strategy:
    // - Each item that wants an upload has item.clientImageId
    // - Each uploaded file's originalname == clientImageId (easy mapping)
    if (req.files?.length) {
      // Build quick lookup: clientImageId -> item index
      const idToIndex = new Map();
      for (let i = 0; i < items.length; i++) {
        const id = items[i]?.clientImageId;
        if (typeof id === "string" && id.length) idToIndex.set(id, i);
      }

      for (const file of req.files) {
        const clientImageId = file.originalname; // match clientImageId
        const idx = idToIndex.get(clientImageId);

        // If client didn't send matching IDs, skip (or you can error)
        if (idx == null) continue;

        const ext = extFromMime(file.mimetype) || "";

        const imageId = crypto.randomUUID();
        const key = `canvas/${memoryId}/${imageId}${ext}`;

        await uploadToR2({
          key,
          buffer: file.buffer,
          contentType: file.mimetype || "application/octet-stream",
        });
        console.log("✅ Uploaded to R2:", key);

        // Store only the key in DB
        items[idx].imageKey = key;

        // Optional cleanup: remove bulky fields you don’t want stored
        delete items[idx].imageData; // if you had base64
      }
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
      [canvasJson, memoryId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Memory not found", memoryId });
    }

    res.json({ ok: true, memoryId });
  } catch (err) {
    console.error("canvas save error:", err);
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

    if (!canvas) {
      return res.json({ items: [], cam: { x: 0, y: 0 } });
    }

    const safeItems = Array.isArray(canvas.items) ? canvas.items : [];
    const safeCam =
      typeof canvas.cam === "object" && canvas.cam ? canvas.cam : { x: 0, y: 0 };

    // Attach signed URLs for any imageKey
    for (const item of safeItems) {
      if (item?.imageKey && typeof item.imageKey === "string") {
        item.imageUrl = await generateSignedUrl(item.imageKey);
      }
    }

    res.json({
      items: safeItems,
      cam: safeCam,
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
