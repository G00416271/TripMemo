import React, { useState, useEffect } from "react";

// ── Colour presets ────────────────────────────────────────────────────────────
const BG_PRESETS = [
  { label: "White",     value: "#ffffff" },
  { label: "Cream",     value: "#FFF8F0" },
  { label: "Soft Gray", value: "#F0F0F0" },
  { label: "Slate",     value: "#1e2230" },
  { label: "Midnight",  value: "#0f0f1a" },
  { label: "Sage",      value: "#EAF0E6" },
  { label: "Blush",     value: "#FDF0F3" },
  { label: "Sky",       value: "#EBF5FF" },
  { label: "Sand",      value: "#F5EDDC" },
  { label: "Charcoal",  value: "#2c2c2c" },
];

// ── Pattern definitions ───────────────────────────────────────────────────────
const PATTERNS = [
  { id: "blank", label: "Blank", icon: BlankIcon },
  { id: "dots",  label: "Dots",  icon: DotsIcon  },
  { id: "grid",  label: "Grid",  icon: GridIcon  },
];

function BlankIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      <rect x="1" y="1" width="34" height="34" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function DotsIcon({ size = 36 }) {
  const dots = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      dots.push(<circle key={`${r}-${c}`} cx={8 + c * 10} cy={8 + r * 10} r="1.8" fill="currentColor" />);
  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      <rect x="1" y="1" width="34" height="34" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {dots}
    </svg>
  );
}

function GridIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      <rect x="1" y="1" width="34" height="34" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {[10, 18, 26].map((v) => (
        <React.Fragment key={v}>
          <line x1={v} y1="3" x2={v} y2="33" stroke="currentColor" strokeWidth="0.9" strokeDasharray="2 2" />
          <line x1="3" y1={v} x2="33" y2={v} stroke="currentColor" strokeWidth="0.9" strokeDasharray="2 2" />
        </React.Fragment>
      ))}
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isDarkColor(hex) {
  const c = (hex ?? "#ffffff").replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

// ── BackgroundOverlay ─────────────────────────────────────────────────────────
// Used by Create.jsx as a simple static HTML overlay behind the toolbar/UI.
// canvas1.jsx uses its own Konva-native BackgroundLayer instead.
export function BackgroundOverlay({ pattern, bgColor, width, height }) {
  if (pattern === "blank") return null;

  const ink = isDarkColor(bgColor) ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)";
  const SPACING = 28;
  const cols = Math.ceil(width  / SPACING) + 2;
  const rows = Math.ceil(height / SPACING) + 2;

  if (pattern === "dots") {
    const dots = [];
    for (let r = 0; r <= rows; r++)
      for (let c = 0; c <= cols; c++)
        dots.push(<circle key={`${r}-${c}`} cx={c * SPACING} cy={r * SPACING} r={1.5} fill={ink} />);
    return (
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} width={width} height={height}>
        {dots}
      </svg>
    );
  }

  if (pattern === "grid") {
    const lines = [];
    for (let c = 0; c <= cols; c++)
      lines.push(<line key={`v${c}`} x1={c * SPACING} y1={0} x2={c * SPACING} y2={height} stroke={ink} strokeWidth={0.8} />);
    for (let r = 0; r <= rows; r++)
      lines.push(<line key={`h${r}`} x1={0} y1={r * SPACING} x2={width} y2={r * SPACING} stroke={ink} strokeWidth={0.8} />);
    return (
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} width={width} height={height}>
        {lines}
      </svg>
    );
  }

  return null;
}

// ── Mini preview ──────────────────────────────────────────────────────────────
function PatternPreview({ pattern, bgColor, size = 36 }) {
  const isDark   = isDarkColor(bgColor);
  const inkAlpha = isDark ? 0.35 : 0.22;
  const ink      = isDark ? `rgba(255,255,255,${inkAlpha})` : `rgba(0,0,0,${inkAlpha})`;
  const sp       = 9;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius: 5, flexShrink: 0 }}>
      <rect width={size} height={size} fill={bgColor} rx="5" />
      {pattern === "dots" && Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (_, c) => (
        <circle key={`${r}-${c}`} cx={4 + c * sp} cy={4 + r * sp} r="1.2" fill={ink} />
      )))}
      {pattern === "grid" && [1, 2, 3].map((n) => (
        <React.Fragment key={n}>
          <line x1={n * sp} y1={0} x2={n * sp} y2={size} stroke={ink} strokeWidth="0.6" />
          <line x1={0} y1={n * sp} x2={size} y2={n * sp} stroke={ink} strokeWidth="0.6" />
        </React.Fragment>
      ))}
      <rect width={size} height={size} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1" rx="5" />
    </svg>
  );
}

export default function BackgroundPicker({ bgColor, pattern, onChange, onClose }) {
  const [localColor,   setLocalColor]   = useState(bgColor  ?? "#ffffff");
  const [localPattern, setLocalPattern] = useState(pattern  ?? "blank");

  // ── Sync when parent restores saved state (e.g. loadCanvas) ──────────────
  useEffect(() => { setLocalColor(bgColor   ?? "#ffffff"); }, [bgColor]);
  useEffect(() => { setLocalPattern(pattern ?? "blank");   }, [pattern]);

  // ... rest unchanged
  function emitColor(c)   { setLocalColor(c);   onChange?.({ bgColor: c,          pattern: localPattern }); }
  function emitPattern(p) { setLocalPattern(p); onChange?.({ bgColor: localColor, pattern: p            }); }

  const isDark   = isDarkColor(localColor);
  const textCol  = isDark ? "#f0f0f0"                    : "#1a1a1a";
  const subCol   = isDark ? "rgba(255,255,255,0.45)"     : "rgba(0,0,0,0.4)";
  const divCol   = isDark ? "rgba(255,255,255,0.1)"      : "rgba(0,0,0,0.08)";
  const hoverBg  = isDark ? "rgba(255,255,255,0.07)"     : "rgba(0,0,0,0.04)";
  const activeBg = isDark ? "rgba(255,255,255,0.14)"     : "rgba(0,0,0,0.08)";

  return (
    <div style={{
      background: isDark ? "rgba(22, 24, 34, 0.97)" : "rgba(255, 255, 255, 0.98)",
      border: `1px solid ${divCol}`, borderRadius: 16, padding: "18px 20px 16px",
      zIndex: 1200, width: 310,
      boxShadow: isDark ? "0 8px 40px rgba(0,0,0,0.6)" : "0 8px 40px rgba(0,0,0,0.14)",
      fontFamily: "'DM Sans', system-ui, sans-serif", color: textCol, userSelect: "none",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PatternPreview pattern={localPattern} bgColor={localColor} size={32} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.02em" }}>Canvas Background</div>
            <div style={{ fontSize: 11, color: subCol, marginTop: 1 }}>
              {BG_PRESETS.find((p) => p.value === localColor)?.label ?? "Custom"} · {PATTERNS.find((p) => p.id === localPattern)?.label}
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: subCol, fontSize: 18, lineHeight: 1, padding: "2px 4px", borderRadius: 6 }}>×</button>
        )}
      </div>

      {/* Pattern picker */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: subCol, marginBottom: 8 }}>PATTERN</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {PATTERNS.map(({ id, label, icon: Icon }) => {
          const active = localPattern === id;
          return (
            <button key={id} onClick={() => emitPattern(id)} title={label} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              padding: "10px 6px 8px",
              border: active ? `2px solid ${isDark ? "#8ab4f8" : "#4a90e2"}` : `1px solid ${divCol}`,
              borderRadius: 10, background: active ? activeBg : "transparent", cursor: "pointer",
              color: active ? (isDark ? "#8ab4f8" : "#4a90e2") : subCol,
              transition: "all 0.15s", fontSize: 11, fontWeight: active ? 600 : 400,
            }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = hoverBg; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={34} />{label}
            </button>
          );
        })}
      </div>

      <div style={{ height: 1, background: divCol, marginBottom: 14 }} />

      {/* Colour presets */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: subCol, marginBottom: 10 }}>COLOUR</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
        {BG_PRESETS.map((c) => {
          const active = localColor === c.value;
          return (
            <button key={c.value} title={c.label} onClick={() => emitColor(c.value)} style={{
              width: 28, height: 28, borderRadius: 7, background: c.value,
              border: active ? `3px solid ${isDark ? "#8ab4f8" : "#4a90e2"}` : "2px solid rgba(128,128,128,0.25)",
              cursor: "pointer", flexShrink: 0,
              transform: active ? "scale(1.18)" : "scale(1)",
              transition: "transform 0.12s, border 0.12s",
              boxShadow: active ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
            }} />
          );
        })}
        <label title="Custom colour" style={{
          width: 28, height: 28, borderRadius: 7, border: `2px dashed ${subCol}`,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, color: subCol, flexShrink: 0, position: "relative",
        }}>
          <span style={{ lineHeight: 1, marginTop: -1 }}>+</span>
          <input type="color" defaultValue={localColor} onChange={(e) => emitColor(e.target.value)}
            style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
        </label>
      </div>

      {/* Hex readout */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, background: hoverBg, border: `1px solid ${divCol}` }}>
        <div style={{ width: 16, height: 16, borderRadius: 4, background: localColor, border: `1px solid ${divCol}`, flexShrink: 0 }} />
        <code style={{ fontSize: 12, letterSpacing: "0.05em", color: subCol, flex: 1 }}>{localColor.toUpperCase()}</code>
        <input type="text" value={localColor}
          onChange={(e) => { const v = e.target.value.trim(); if (/^#[0-9a-fA-F]{6}$/.test(v)) emitColor(v); else setLocalColor(v); }}
          onBlur={() => { if (!/^#[0-9a-fA-F]{6}$/.test(localColor)) emitColor(bgColor); }}
          style={{ width: 80, fontSize: 12, fontFamily: "monospace", background: "transparent", border: "none", outline: "none", color: textCol, textAlign: "right" }}
        />
      </div>
    </div>
  );
}