// canvasShareRoutes.js
// Public endpoint — no requireAuth. Anyone with the memoryId can read.

import express from "express";
import supabase from "./supabaseClient.js";
import { generateSignedUrl } from "./r2.js";

const router = express.Router();

function parseMemoryId(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ── GET /api/canvas/share/:memoryId (public — no auth) ──────────────────────
router.get("/share/:memoryId", async (req, res) => {
  try {
    const memoryId = parseMemoryId(req.params.memoryId);
    if (!memoryId) return res.status(400).json({ error: "Invalid memoryId" });

    const { data, error } = await supabase
      .from("memories")
      .select("title, elements, tags")
      .eq("memory_id", memoryId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Memory not found", memoryId });

    const canvas = data.elements?.canvas || null;
    const safeItems = Array.isArray(canvas?.items) ? canvas.items : [];
    const safeCam = canvas?.cam && typeof canvas.cam === "object" ? canvas.cam : { x: 0, y: 0 };
    const safeZoom = canvas?.zoom ?? 1;
    const safeBgColor = canvas?.bgColor ?? "#ffffff";
    const safeBgPat = canvas?.bgPattern ?? "blank";

    // tags
    const tagsRaw = data.tags || [];
    let tags = [];
    if (Array.isArray(tagsRaw)) {
      tags = tagsRaw;
    } else if (tagsRaw && typeof tagsRaw === "object") {
      tags = [
        ...(Array.isArray(tagsRaw.main) ? tagsRaw.main : []),
        ...(Array.isArray(tagsRaw.sub) ? tagsRaw.sub : []),
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
        item.frame = item.frame ?? "none";
        item.fontFamily = item.fontFamily ?? "Arial";
        item.fontColor = item.fontColor ?? "#000000";
      }
    }

    res.json({
      memoryId,
      memoryTitle: data.title ?? "Untitled",
      items: safeItems,
      cam: safeCam,
      zoom: safeZoom,
      bgColor: safeBgColor,
      bgPattern: safeBgPat,
      tags,
      updatedAt: canvas?.updatedAt ?? null,
    });
  } catch (err) {
    console.error("canvas share load error:", err);
    res.status(500).json({ error: "Failed to load shared canvas", details: err?.message ?? String(err) });
  }
});

export default router;