// CanvasThumbnail.jsx
//
// A lightweight thumbnail/preview card for a saved canvas.
// Renders a mini Konva stage at a fixed size — no editing, no pan/zoom.
//
// Props:
//   memoryId       number   — which canvas to load
//   memoryTitle    string   — displayed as label
//   width          number   — thumbnail width  (default 280)
//   height         number   — thumbnail height (default 180)
//   onClick        fn       — called when the card is clicked
//   showShareBtn   bool     — show "Copy share link" icon (default true)
//   showExportBtn  bool     — show "Export PNG" icon (default true)
//   className      string   — extra CSS class for the outer wrapper
//
// The component fetches from /api/canvas/share/:memoryId (public endpoint).
// It re-renders only when memoryId changes; canvas data is cached locally.

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Line, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { proxy } from "./proxy";

// ── tiny helpers ──────────────────────────────────────────────────────────────
function isDark(hex) {
  const c = (hex ?? "#fff").replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

// Scale items from their original world-space into the thumbnail viewport.
function scaleItems(items, scale, offsetX, offsetY) {
  return items.map((it) => {
    const base = { ...it, x: it.x * scale + offsetX, y: it.y * scale + offsetY };
    if (it.type === "rect" || it.type === "image" || it.type === "deezer")
      return { ...base, w: it.w * scale, h: it.h * scale };
    if (it.type === "text")
      return { ...base, fontSize: Math.max(6, (it.fontSize ?? 24) * scale) };
    if (it.type === "line" || it.type === "pencil")
      return { ...base, points: it.points.map((v, i) => i % 2 === 0 ? v * scale + offsetX : v * scale + offsetY) };
    return base;
  });
}

// Compute scale + offset to fit all items inside the thumbnail.
function computeFit(items, tw, th, padding = 12) {
  if (!items.length) return { scale: 1, offsetX: 0, offsetY: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const it of items) {
    const x1 = it.x ?? 0, y1 = it.y ?? 0;
    let x2 = x1, y2 = y1;
    if (it.type === "rect" || it.type === "image" || it.type === "deezer") {
      x2 = x1 + (it.w ?? 0); y2 = y1 + (it.h ?? 0);
    } else if (it.type === "text") {
      x2 = x1 + 200; y2 = y1 + (it.fontSize ?? 24);
    } else if (it.type === "line" || it.type === "pencil") {
      const pts = it.points ?? [];
      for (let i = 0; i < pts.length; i += 2) {
        minX = Math.min(minX, pts[i]);   maxX = Math.max(maxX, pts[i]);
        minY = Math.min(minY, pts[i+1]); maxY = Math.max(maxY, pts[i+1]);
      }
      continue;
    }
    minX = Math.min(minX, x1); maxX = Math.max(maxX, x2);
    minY = Math.min(minY, y1); maxY = Math.max(maxY, y2);
  }
  if (!isFinite(minX)) return { scale: 1, offsetX: 0, offsetY: 0 };
  const worldW = maxX - minX, worldH = maxY - minY;
  if (worldW <= 0 || worldH <= 0) return { scale: 1, offsetX: padding, offsetY: padding };
  const scale = Math.min((tw - padding * 2) / worldW, (th - padding * 2) / worldH, 1);
  const offsetX = padding + ((tw - padding * 2) - worldW * scale) / 2 - minX * scale;
  const offsetY = padding + ((th - padding * 2) - worldH * scale) / 2 - minY * scale;
  return { scale, offsetX, offsetY };
}

// ── mini item renderers ───────────────────────────────────────────────────────
function MiniImage({ it }) {
  const src = it.imageUrl ?? it.src;
  const needsProxy = src && !src.startsWith("data:") && !src.includes("dzcdn.net");
  const [img] = useImage(needsProxy ? proxy(src) : src || "", "anonymous");
  return <KonvaImage image={img} x={it.x} y={it.y} width={it.w} height={it.h} listening={false} />;
}

function MiniDeezer({ it }) {
  const [img] = useImage(it.src ? proxy(it.src) : "", "anonymous");
  return (
    <>
      <KonvaImage image={img} x={it.x} y={it.y} width={it.w} height={it.h} listening={false} />
    </>
  );
}

// ── cache to avoid refetching on every mount ──────────────────────────────────
const _cache = {};

// ── main component ────────────────────────────────────────────────────────────
export default function CanvasThumbnail({
  memoryId,
  memoryTitle,
  width  = 280,
  height = 180,
  onClick,
  showShareBtn  = true,
  showExportBtn = true,
  className = "",
}) {
  const stageRef = useRef(null);
  const [data,  setData]    = useState(_cache[memoryId] ?? null);
  const [state, setState]   = useState(_cache[memoryId] ? "ready" : "loading");
  const [toastMsg, setToastMsg] = useState(null);

  // ── fetch ──
  useEffect(() => {
    if (_cache[memoryId]) { setData(_cache[memoryId]); setState("ready"); return; }
    setState("loading");
    fetch(`http://localhost:5000/api/canvas/share/${memoryId}?preview=true`)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((d) => { _cache[memoryId] = d; setData(d); setState("ready"); })
      .catch(() => setState("error"));
  }, [memoryId]);

  // ── derive scaled items ──
  const { scaledItems, bgColor, bgPattern } = React.useMemo(() => {
    if (!data) return { scaledItems: [], bgColor: "#ffffff", bgPattern: "blank" };
    const { scale, offsetX, offsetY } = computeFit(data.items ?? [], width, height);
    return {
      scaledItems: scaleItems(data.items ?? [], scale, offsetX, offsetY),
      bgColor:  data.bgColor  ?? "#ffffff",
      bgPattern: data.bgPattern ?? "blank",
    };
  }, [data, width, height]);

  const dark = isDark(bgColor);

  // ── toast ──
  const flash = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  // ── export ──
  const handleExport = useCallback(async (e) => {
    e.stopPropagation();
    const stage = stageRef.current;
    if (!stage) return;
    await new Promise((r) => setTimeout(r, 80));
    const dataUrl = stage.toDataURL({ pixelRatio: 3, mimeType: "image/png" });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${memoryTitle || data?.memoryTitle || "canvas"}.png`;
    a.click();
    flash("Exported!");
  }, [data, memoryTitle]);

  const handleShare = useCallback((e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/share/${memoryId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => flash("Link copied!"))
      .catch(() => flash("Could not copy"));
  }, [memoryId]);

  // ── icon button style ──
  const iconBtn = {
    width: 28, height: 28, borderRadius: 7,
    border: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
    background: dark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.85)",
    backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: dark ? "#e0d8f8" : "#1a1a2e",
    flexShrink: 0,
    transition: "background 0.15s, transform 0.1s",
  };

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        position: "relative",
        width, height,
        borderRadius: 14,
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0 2px 18px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
        background: bgColor,
        fontFamily: "'DM Sans', sans-serif",
        flexShrink: 0,
      }}
    >
      {/* Google font */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* ── canvas ── */}
      {state === "ready" && (
        <Stage ref={stageRef} width={width} height={height} listening={false}>
          <Layer listening={false}>
            {scaledItems.map((it, idx) => {
              if (it.type === "rect")
                return <Rect key={idx} x={it.x} y={it.y} width={it.w} height={it.h}
                  fill="transparent" stroke="black" strokeWidth={0.6} listening={false} />;
              if (it.type === "line")
                return <Line key={idx} points={it.points} stroke={it.color ?? "#2d2d2d"} strokeWidth={1.5} listening={false} />;
              if (it.type === "pencil")
                return <Line key={idx} points={it.points} stroke={it.color ?? "#2d2d2d"} strokeWidth={1.5}
                  lineCap="round" lineJoin="round" listening={false} />;
              if (it.type === "text")
                return <Text key={idx} x={it.x} y={it.y} text={it.text}
                  fontSize={it.fontSize} fill="black" listening={false} />;
              if (it.type === "image")
                return <MiniImage key={idx} it={it} />;
              if (it.type === "deezer")
                return <MiniDeezer key={idx} it={it} />;
              return null;
            })}
          </Layer>
        </Stage>
      )}

      {/* ── loading ── */}
      {state === "loading" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: "#f5f3ff" }}>
          <div style={{ color: "#a78bfa", fontSize: 22, animation: "thumbnailSpin 1.2s linear infinite" }}>◌</div>
          <style>{`@keyframes thumbnailSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── error ── */}
      {state === "error" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: "#fef2f2" }}>
          <span style={{ color: "#f87171", fontSize: 12 }}>Preview unavailable</span>
        </div>
      )}


      {/* ── VIEW ONLY badge (top-right) ──
      <div style={{
        position: "absolute", top: 8, right: 8,
        background: dark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.8)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: 20, padding: "2px 7px",
        fontSize: 9, fontWeight: 700,
        color: dark ? "#c4b5fd" : "#7c3aed",
        letterSpacing: "0.07em",
        display: "flex", alignItems: "center", gap: 3,
        pointerEvents: "none",
      }}>
        <svg width="8" height="9" viewBox="0 0 8 9" fill="none">
          <rect x="1" y="3.5" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
          <path d="M2.5 3.5V2.5a1.5 1.5 0 013 0v1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
        VIEW ONLY
      </div> */}

      {/* ── toast ── */}
      {toastMsg && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(26,26,46,0.9)", color: "#e8e0f5",
          padding: "6px 14px", borderRadius: 20,
          fontSize: 11, fontWeight: 600, pointerEvents: "none",
          whiteSpace: "nowrap", zIndex: 10,
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
