// canvasDbRoutes.js
import express from "express";
import db from "./db.js";
import multer from "multer";
import crypto from "crypto";
import { uploadToR2, generateSignedUrl, deleteFromR2 } from "./r2.js";

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

  if (Buffer.isBuffer(value)) {
    try {
      return JSON.parse(value.toString("utf8"));
    } catch {
      return fallback;
    }
  }

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
 * - tags: JSON string (array)
 * - images: files[] (optional)
 */
router.post("/save", upload.array("images"), async (req, res) => {
  try {
    const memoryId = parseMemoryId(req.body?.memoryId);

    const items = safeParseJson(req.body?.items, []);
    const cam = safeParseJson(req.body?.cam, { x: 0, y: 0 });
    // tags can be: ["volleyball", ...]  OR legacy {main,sub,third}
    const tagsRaw = safeParseJson(req.body?.tags, []);
    let tags = [];

    if (Array.isArray(tagsRaw)) {
      tags = tagsRaw;
    } else if (tagsRaw && typeof tagsRaw === "object") {
      const main = Array.isArray(tagsRaw.main) ? tagsRaw.main : [];
      const sub = Array.isArray(tagsRaw.sub) ? tagsRaw.sub : [];
      const third = Array.isArray(tagsRaw.third) ? tagsRaw.third : [];
      tags = [...main, ...sub, ...third];
    } else {
      return res.status(400).json({ error: "tags must be an array" });
    }

    // clean + dedupe + ensure strings
    tags = [
      ...new Set(
        tags
          .filter((t) => typeof t === "string" && t.trim())
          .map((t) => t.trim()),
      ),
    ];

    console.log("memoryId:", memoryId);
    console.log("tags from client:", tags);
    // Upload images and map onto items by clientImageId
    if (req.files?.length) {
      const idToIndex = new Map();
      for (let i = 0; i < items.length; i++) {
        const id = items[i]?.clientImageId;
        if (typeof id === "string" && id.length) idToIndex.set(id, i);
      }

      for (const file of req.files) {
        const clientImageId = file.originalname;
        const idx = idToIndex.get(clientImageId);
        if (idx == null) continue;

        const ext = extFromMime(file.mimetype) || "";
        const imageId = crypto.randomUUID();
        const key = `canvas/${memoryId}/${imageId}${ext}`;

        await uploadToR2({
          key,
          buffer: file.buffer,
          contentType: file.mimetype || "application/octet-stream",
        });

        items[idx].imageKey = key;
      }
    }

    const canvasObj = { items, cam, updatedAt: Date.now() };
    const canvasJson = JSON.stringify(canvasObj);
    const tagsJson = JSON.stringify(tags);

    const [result] = await db.execute(
      `
      UPDATE memories
      SET
        elements = JSON_SET(
          IF(JSON_TYPE(elements) = 'OBJECT', elements, JSON_OBJECT()),
          '$.canvas',
          CAST(? AS JSON)
        ),
        tags = CAST(? AS JSON)
      WHERE memory_id = ?
      `,
      [canvasJson, tagsJson, memoryId],
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
    if (!memoryId) return res.status(400).json({ error: "memoryId required" });

    const [rows] = await db.execute(
      `
      SELECT
        JSON_EXTRACT(elements, '$.canvas') AS canvas,
        tags
      FROM memories
      WHERE memory_id = ?
      LIMIT 1
      `,
      [memoryId],
    );

    if (!rows.length)
      return res.status(404).json({ error: "Memory not found", memoryId });

    const canvas = safeParseCanvas(rows[0].canvas);

    // ✅ FIX: define these
    const safeItems = Array.isArray(canvas?.items) ? canvas.items : [];
    const safeCam =
      canvas?.cam && typeof canvas.cam === "object" ? canvas.cam : { x: 0, y: 0 };

    // ✅ tags: array OR legacy object
    const tagsRaw = safeParseJson(rows[0].tags, []);
    let tags = [];

    if (Array.isArray(tagsRaw)) {
      tags = tagsRaw;
    } else if (tagsRaw && typeof tagsRaw === "object") {
      const main = Array.isArray(tagsRaw.main) ? tagsRaw.main : [];
      const sub = Array.isArray(tagsRaw.sub) ? tagsRaw.sub : [];
      const third = Array.isArray(tagsRaw.third) ? tagsRaw.third : [];
      tags = [...main, ...sub, ...third];
    }

    tags = [...new Set(tags.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim()))];

    // ✅ FIX: restore signed urls
    for (const item of safeItems) {
      if (item?.imageKey && typeof item.imageKey === "string") {
        item.imageUrl = await generateSignedUrl(item.imageKey);
      }
    }

    res.json({
      items: safeItems,
      cam: safeCam,
      tags,
      updatedAt: canvas?.updatedAt ?? null,
    });
  } catch (err) {
    console.error("canvas load error:", err);
    res.status(500).json({
      error: "Failed to load canvas",
      details: err?.message ?? String(err),
    });
  }
});


// DELETE /api/canvas/delete?memoryId=123
router.delete("/delete", async (req, res) => {
  try {
    const memoryId = parseMemoryId(req.query?.memoryId);
    if (!memoryId) return res.status(400).json({ error: "memoryId required" });

    // 1) DB update
    const [dbResult] = await db.execute(
      `
      UPDATE memories
      SET
        elements = JSON_REMOVE(
          IF(JSON_TYPE(elements) = 'OBJECT', elements, JSON_OBJECT()),
          '$.canvas'
        ),
        tags = JSON_ARRAY()
      WHERE memory_id = ?
      `,
      [memoryId]
    );

    if (dbResult.affectedRows === 0) {
      return res.status(404).json({ error: "Memory not found", memoryId });
    }

    // 2) R2 delete (count how many got deleted)
    let deletedCount = 0;
    try {
      deletedCount = await deleteFromR2(`canvas/${memoryId}/`);
    } catch (err) {
      console.error("Error deleting from R2:", err);
      // choose behavior:
      // A) still return ok:true but include warning
      // B) return 500 to force client to retry
      // I'll do A (common for cleanup tasks)
      return res.status(200).json({
        ok: true,
        deleted: true,
        memoryId,
        deletedCount: 0,
        warning: "Canvas deleted in DB, but failed to delete images from R2",
      });
    }

    if (deletedCount === 0) {
      console.warn("No images found in R2 for memoryId:", memoryId);
    } else {
      console.log(`Deleted ${deletedCount} images from R2 for memoryId:`, memoryId);
    }

    // 3) respond once
    return res.status(200).json({ ok: true, deleted: true, memoryId, deletedCount });
  } catch (err) {
    console.error("canvas delete error:", err);
    return res.status(500).json({
      error: "Failed to delete canvas",
      details: err?.message ?? String(err),
    });
  }
});

export default router;
