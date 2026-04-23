// ViewOnlyCanvas.jsx
//
// Usage:  <ViewOnlyCanvas memoryId={123} />
//
// Route:  /share/:memoryId  (public, no auth)
//
// Features
//   • Full read-only Konva canvas (pan + zoom, no editing)
//   • "Copy link" button
//   • "Export PNG" — downloads canvas as image
//   • "Copy image" — puts PNG on clipboard
//   • Tags chip list
//   • Graceful loading / error states

import React, { useRef, useState, useEffect, useCallback } from "react";
import Konva from "konva";
import {
  Stage,
  Layer,
  Rect,
  Line,
  Text,
  Circle,
  Image as KonvaImage,
} from "react-konva";
import useImage from "use-image";
import { proxy } from "./proxy";
import DeezerCard from "./toolbox/deezercard";

// ── helpers ───────────────────────────────────────────────────────────────────
function isDarkColor(hex) {
  const c = (hex ?? "#ffffff").replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function BackgroundLayer({ pattern, bgColor, zoom, size, cam }) {
  if (pattern === "blank") return null;
  if (zoom < 0.25) return null;
  const SPACING = 28;
  const ink = isDarkColor(bgColor)
    ? "rgba(255,255,255,0.18)"
    : "rgba(0,0,0,0.12)";
  const offsetX = (((cam.x / zoom) % SPACING) + SPACING) % SPACING;
  const offsetY = (((cam.y / zoom) % SPACING) + SPACING) % SPACING;
  const worldW = size.w / zoom + SPACING * 2;
  const worldH = size.h / zoom + SPACING * 2;
  const worldX = -cam.x / zoom - offsetX;
  const worldY = -cam.y / zoom - offsetY;
  const patternId = `bg-${pattern}`;
  const svgContent =
    pattern === "dots"
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="${worldW}" height="${worldH}">
           <defs><pattern id="${patternId}" x="0" y="0" width="${SPACING}" height="${SPACING}" patternUnits="userSpaceOnUse">
             <circle cx="${SPACING / 2}" cy="${SPACING / 2}" r="1.5" fill="${ink}" />
           </pattern></defs>
           <rect width="100%" height="100%" fill="url(#${patternId})" />
         </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="${worldW}" height="${worldH}">
           <defs><pattern id="${patternId}" x="0" y="0" width="${SPACING}" height="${SPACING}" patternUnits="userSpaceOnUse">
             <path d="M ${SPACING} 0 L 0 0 0 ${SPACING}" fill="none" stroke="${ink}" stroke-width="0.8" />
           </pattern></defs>
           <rect width="100%" height="100%" fill="url(#${patternId})" />
         </svg>`;
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
  const [img] = useImage(dataUrl);
  return (
    <KonvaImage image={img} x={worldX} y={worldY} width={worldW} height={worldH}
      listening={false} perfectDrawEnabled={false} />
  );
}

function CanvasImageItem({ it }) {
  const actualSrc = it.imageUrl ?? it.src;
  const shouldProxy = actualSrc && !actualSrc.startsWith("data:") && !actualSrc.includes("dzcdn.net");
  const [img] = useImage(shouldProxy ? proxy(actualSrc) : actualSrc || "", "anonymous");
  return <KonvaImage image={img} x={it.x} y={it.y} width={it.w} height={it.h} listening={false} />;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, visible }) {
  return (
    <div style={{
      position: "fixed", bottom: 32, left: "50%", transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`,
      opacity: visible ? 1 : 0, transition: "all 0.25s ease",
      background: "#1a1a2e", color: "#e8e0f5", padding: "10px 22px",
      borderRadius: 30, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
      fontWeight: 500, letterSpacing: "0.02em", zIndex: 9999,
      boxShadow: "0 4px 24px rgba(0,0,0,0.22)", pointerEvents: "none",
      border: "1px solid rgba(255,255,255,0.08)"
    }}>
      {message}
    </div>
  );
}

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ title, tags, onExportPng, onCopyImage, onCopyLink, exporting, dark }) {
  const fg = dark ? "#f0eaff" : "#1a1a2e";
  const fgMuted = dark ? "rgba(240,234,255,0.55)" : "rgba(26,26,46,0.5)";
  const barBg = dark
    ? "rgba(15,12,30,0.72)"
    : "rgba(255,255,255,0.82)";
  const btnBg = dark ? "rgba(255,255,255,0.08)" : "rgba(26,26,46,0.06)";
  const btnHover = dark ? "rgba(255,255,255,0.14)" : "rgba(26,26,46,0.12)";
  const tagBg = dark ? "rgba(255,255,255,0.1)" : "rgba(26,26,46,0.07)";

  const btnStyle = (accent) => ({
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 14px", borderRadius: 8,
    border: `1px solid ${accent ? "rgba(139,92,246,0.5)" : (dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")}`,
    background: accent ? "rgba(139,92,246,0.15)" : btnBg,
    color: accent ? (dark ? "#c4b5fd" : "#7c3aed") : fg,
    fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.03em", cursor: "pointer",
    transition: "background 0.15s, transform 0.1s",
  });

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      height: 56,
      background: barBg,
      backdropFilter: "blur(18px) saturate(180%)",
      borderBottom: dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
      display: "flex", alignItems: "center", padding: "0 20px", gap: 16,
    }}>
      {/* Lock badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 20,
        background: dark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.1)",
        border: "1px solid rgba(139,92,246,0.3)",
        color: dark ? "#c4b5fd" : "#7c3aed",
        fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.06em", flexShrink: 0,
      }}>
        <svg width="10" height="11" viewBox="0 0 10 11" fill="none">
          <rect x="1.5" y="4.5" width="7" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M3 4.5V3a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        VIEW ONLY
      </div>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: fg, fontFamily: "'DM Sans', sans-serif",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {title || "Untitled Canvas"}
        </div>
        {tags?.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "nowrap", overflow: "hidden" }}>
            {tags.slice(0, 6).map((t) => (
              <span key={t} style={{
                background: tagBg, color: fgMuted,
                borderRadius: 4, padding: "1px 6px", fontSize: 10,
                fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                whiteSpace: "nowrap",
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button style={btnStyle(false)} onClick={onCopyLink}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M5 8L8 5M7.5 2.5L9 1a2.12 2.12 0 013 3L10.5 5.5a2.12 2.12 0 01-3 0M5.5 7.5a2.12 2.12 0 01-3 0L1 6a2.12 2.12 0 013-3L5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          Copy link
        </button>
        <button style={btnStyle(false)} onClick={onCopyImage} disabled={exporting}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M4 12h7a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          Copy image
        </button>
        <button style={btnStyle(true)} onClick={onExportPng} disabled={exporting}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v8M3.5 6.5L6.5 9.5l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.5 10.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          {exporting ? "Exporting…" : "Export PNG"}
        </button>
      </div>
    </div>
  );
}

// ── Zoom controls ─────────────────────────────────────────────────────────────
function ZoomControls({ zoom, onZoom, onReset, dark }) {
  const fg = dark ? "#e0d8f8" : "#1a1a2e";
  const bg = dark ? "rgba(15,12,30,0.72)" : "rgba(255,255,255,0.9)";
  const border = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const s = {
    width: 32, height: 28, border: `1px solid ${border}`, borderRadius: 6,
    background: "transparent", cursor: "pointer", fontSize: 16,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "bold", color: fg,
  };
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 200,
      display: "flex", flexDirection: "column", gap: 4,
      background: bg, backdropFilter: "blur(12px)",
      border: `1px solid ${border}`, borderRadius: 10, padding: 6,
      boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
    }}>
      <button style={s} onClick={() => onZoom(0.15)} title="Zoom in">＋</button>
      <div style={{ textAlign: "center", fontSize: 11, color: fg, padding: "2px 0", opacity: 0.7,
        fontFamily: "'DM Mono', monospace" }}>
        {Math.round(zoom * 100)}%
      </div>
      <button style={s} onClick={() => onZoom(-0.15)} title="Zoom out">－</button>
      <button style={{ ...s, fontSize: 9 }} onClick={onReset} title="Reset">FIT</button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ViewOnlyCanvas({ memoryId }) {
  const stageRef   = useRef(null);
  const camRef     = useRef({ x: 0, y: 0 });
  const isPanRef   = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const lastPinchDistRef = useRef(null);
  const lastPinchMidRef  = useRef(null);
  const panHandlersRef   = useRef({});

  const MIN_ZOOM = 0.15, MAX_ZOOM = 4;

  const [size, setSize]     = useState({ w: window.innerWidth, h: window.innerHeight });
  const [cam, setCam]       = useState({ x: 0, y: 0 });
  const [zoom, setZoom]     = useState(1);
  const [items, setItems]   = useState([]);
  const [bgColor, setBgColor]   = useState("#ffffff");
  const [bgPattern, setBgPattern] = useState("blank");
  const [title, setTitle]   = useState("");
  const [tags, setTags]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]   = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast]   = useState({ visible: false, message: "" });

  const dark = isDarkColor(bgColor);

  // ── resize ──
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── load ──
  useEffect(() => {
    if (!memoryId) return;
    setLoading(true);
    setError(null);
    fetch(`https://tripmemo-11.onrender.com/api/canvas/share/${memoryId}`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
        const lc = data.cam ?? { x: 0, y: 0 };
        setCam(lc); camRef.current = lc;
        setZoom(data.zoom ?? 1);
        setBgColor(data.bgColor ?? "#ffffff");
        setBgPattern(data.bgPattern ?? "blank");
        setTitle(data.memoryTitle ?? "");
        setTags(Array.isArray(data.tags) ? data.tags : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [memoryId]);

  // ── toast helper ──
  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message }), 2400);
  };

  // ── zoom ──
  function handleZoom(delta, focalX, focalY) {
    setZoom((prev) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
      if (focalX !== undefined)
        setCam((c) => ({
          x: focalX - (focalX - c.x) * (next / prev),
          y: focalY - (focalY - c.y) * (next / prev),
        }));
      return next;
    });
  }

  function handleWheel(e) {
    e.evt.preventDefault();
    const p = stageRef.current.getPointerPosition();
    handleZoom(e.evt.deltaY > 0 ? -0.08 : 0.08, p.x, p.y);
  }

  // ── pan (imperative, zero renders during drag) ──
  useEffect(() => {
    panHandlersRef.current.move = (e) => {
      if (!isPanRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      const stage = stageRef.current;
      if (!stage) return;
      stage.x(stage.x() + dx); stage.y(stage.y() + dy);
      stage.batchDraw();
      camRef.current = { x: stage.x(), y: stage.y() };
    };
    panHandlersRef.current.up = () => {
      if (!isPanRef.current) return;
      isPanRef.current = false;
      const stage = stageRef.current;
      if (stage) { const c = { x: stage.x(), y: stage.y() }; setCam(c); camRef.current = c; }
      window.removeEventListener("mousemove", panHandlersRef.current.move);
      window.removeEventListener("mouseup",   panHandlersRef.current.up);
    };
  }, []);

  function handleMouseDown(e) {
    if (e.evt.button === 1 || e.evt.button === 0) {
      isPanRef.current = true;
      lastMouseRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      window.addEventListener("mousemove", panHandlersRef.current.move);
      window.addEventListener("mouseup",   panHandlersRef.current.up);
    }
  }

  // ── touch ──
  function handleTouchStart(e) {
    const t = e.evt.touches;
    if (t.length === 2) {
      lastPinchDistRef.current = Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
      lastPinchMidRef.current  = { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 };
    } else {
      isPanRef.current = true;
      lastMouseRef.current = { x: t[0].clientX, y: t[0].clientY };
    }
  }

  function handleTouchMove(e) {
    const t = e.evt.touches;
    if (t.length === 2 && lastPinchDistRef.current !== null) {
      e.evt.preventDefault();
      const dist = Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
      const mid  = { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 };
      handleZoom((dist / lastPinchDistRef.current - 1) * zoom * 0.02, mid.x, mid.y);
      if (lastPinchMidRef.current)
        setCam((prev) => ({ x: prev.x + mid.x - lastPinchMidRef.current.x, y: prev.y + mid.y - lastPinchMidRef.current.y }));
      lastPinchDistRef.current = dist;
      lastPinchMidRef.current  = mid;
    } else if (t.length === 1 && isPanRef.current) {
      const dx = t[0].clientX - lastMouseRef.current.x, dy = t[0].clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: t[0].clientX, y: t[0].clientY };
      const stage = stageRef.current;
      if (stage) { stage.x(stage.x() + dx); stage.y(stage.y() + dy); stage.batchDraw(); camRef.current = { x: stage.x(), y: stage.y() }; }
    }
  }

  function handleTouchEnd() {
    lastPinchDistRef.current = null; lastPinchMidRef.current = null;
    if (isPanRef.current && stageRef.current) setCam({ x: stageRef.current.x(), y: stageRef.current.y() });
    isPanRef.current = false;
  }

  // ── export helpers ──
  const getExportDataUrl = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return null;
    // Wait for images to settle
    await new Promise((r) => setTimeout(r, 120));
    return stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });
  }, []);

  const handleExportPng = useCallback(async () => {
    setExporting(true);
    try {
      const dataUrl = await getExportDataUrl();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${title || "canvas"}.png`;
      a.click();
      showToast("PNG downloaded ✓");
    } finally {
      setExporting(false);
    }
  }, [getExportDataUrl, title]);

  const handleCopyImage = useCallback(async () => {
    setExporting(true);
    try {
      const dataUrl = await getExportDataUrl();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      showToast("Image copied to clipboard ✓");
    } catch {
      showToast("Clipboard copy failed — try Export PNG instead");
    } finally {
      setExporting(false);
    }
  }, [getExportDataUrl]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast("Link copied ✓"))
      .catch(() => showToast("Could not copy link"));
  }, []);

  // ── loading / error ──
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#0f0c1e", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", color: "#c4b5fd" }}>
        <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1.2s linear infinite" }}>◌</div>
        <div style={{ fontSize: 14, opacity: 0.7 }}>Loading canvas…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#0f0c1e", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", color: "#f87171", maxWidth: 360, padding: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Canvas not found</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>Error {error} — this canvas may be private or doesn't exist.</div>
      </div>
    </div>
  );

  return (
    <div onContextMenu={(e) => e.preventDefault()}
      style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative",
        background: bgColor, touchAction: "none", cursor: "grab",
        fontFamily: "'DM Sans', sans-serif" }}>

      {/* Google font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono&display=swap" rel="stylesheet" />

      <TopBar
        title={title} tags={tags} dark={dark}
        onExportPng={handleExportPng}
        onCopyImage={handleCopyImage}
        onCopyLink={handleCopyLink}
        exporting={exporting}
      />

      <ZoomControls
        zoom={zoom} dark={dark}
        onZoom={handleZoom}
        onReset={() => { setZoom(1); const c = { x: 0, y: 0 }; setCam(c); camRef.current = c; }}
      />

      <Stage
        ref={stageRef}
        width={size.w} height={size.h}
        x={cam.x} y={cam.y}
        scaleX={zoom} scaleY={zoom}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.evt.preventDefault()}
      >
        <Layer listening={false}>
          <BackgroundLayer pattern={bgPattern} bgColor={bgColor} zoom={zoom} size={size} cam={cam} />
        </Layer>

        <Layer listening={false}>
          {items.map((it) => {
            if (it.type === "rect")
              return <Rect key={it.id} x={it.x} y={it.y} width={it.w} height={it.h}
                fill="transparent" stroke="black" strokeWidth={1} />;
            if (it.type === "line")
              return <Line key={it.id} points={it.points} stroke={it.color ?? "#2d2d2d"} strokeWidth={3} />;
            if (it.type === "pencil")
              return <Line key={it.id} points={it.points} stroke={it.color ?? "#2d2d2d"} strokeWidth={3}
                lineCap="round" lineJoin="round" />;
            if (it.type === "text")
              return <Text key={it.id} x={it.x} y={it.y} text={it.text}
                fontSize={it.fontSize ?? 24} fill="black" />;
            if (it.type === "image")
              return <CanvasImageItem key={it.id} it={it} />;
            if (it.type === "deezer")
              return (
                <DeezerCard key={it.id} it={it} isSelected={false} tool="selection"
                  onSelect={() => {}} onDragEnd={() => {}} onContextMenu={() => {}}
                  onResize={() => {}} snap={(v) => v} nodeRef={() => {}} />
              );
            return null;
          })}
        </Layer>
      </Stage>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
