import React, { useMemo } from "react";
import { FiArrowLeft, FiSave } from "react-icons/fi";

// ── colour math ───────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = (hex ?? "#ffffff").replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Returns a saturated, slightly darkened version of the input colour for the navbar */
function deriveNavColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);

  // Boost saturation strongly, pull lightness toward a mid-dark band
  const newS = Math.min(100, s < 8 ? 0 : s * 1.6 + 20); // desaturated colours stay neutral
  const newL = s < 8
    ? (l > 50 ? 18 : 88)          // pure greys → near-black or near-white bar
    : Math.max(18, Math.min(38, l * 0.55)); // coloured → rich dark tint

  return hslToHex(h, newS, newL);
}

/** Luminance-based contrast: returns "#ffffff" or "#151515" */
function contrastText(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lum = (r * 299 + g * 587 + b * 114) / 1000;
  return lum < 128 ? "#ffffff" : "#151515";
}

// ── component ─────────────────────────────────────────────────────────────────

export default function NavBar({ setActiveTab, avatarUrl, bgColor = "#ffffff", memoryName, onSave, onCanvas = false }) {
  const navBg   = useMemo(() => onCanvas ? deriveNavColor(bgColor) : "#ffffff", [bgColor, onCanvas]);
  const textCol = useMemo(() => contrastText(navBg), [navBg]);
  const subCol  = textCol === "#ffffff"
    ? "rgba(255,255,255,0.55)"
    : "rgba(0,0,0,0.45)";
  const pillBg  = textCol === "#ffffff"
    ? "rgba(255,255,255,0.12)"
    : "rgba(0,0,0,0.08)";
  const pillHov = textCol === "#ffffff"
    ? "rgba(255,255,255,0.22)"
    : "rgba(0,0,0,0.14)";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

        .wandr-navbar {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0 16px;
          height: 54px;
          width: 100%;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1100;
          transition: background 0.4s ease;
          box-sizing: border-box;
        }

        .wandr-navbar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: inherit;
          opacity: 0.92;
          backdrop-filter: blur(14px) saturate(160%);
          -webkit-backdrop-filter: blur(14px) saturate(160%);
          z-index: -1;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .wandr-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: none;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          border-radius: 10px;
          padding: 7px 12px;
          transition: background 0.18s, transform 0.12s;
          flex-shrink: 0;
          letter-spacing: 0.01em;
        }
        .wandr-nav-btn:hover  { transform: scale(1.04); }
        .wandr-nav-btn:active { transform: scale(0.97); }

        .wandr-nav-title {
          flex: 1;
          text-align: center;
          font-family: 'Nunito', sans-serif;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 0 8px;
          pointer-events: none;
          user-select: none;
        }

        .wandr-nav-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          opacity: 0.9;
        }
      `}</style>

      <nav
        className="wandr-navbar"
        style={{ background: navBg }}
      >
        {/* Back button */}
        <button
          className="wandr-nav-btn"
          style={{ color: textCol, background: pillBg }}
          onClick={() => setActiveTab("create")}
          onMouseEnter={(e) => e.currentTarget.style.background = pillHov}
          onMouseLeave={(e) => e.currentTarget.style.background = pillBg}
          aria-label="Back to scrapbooks"
        >
          <FiArrowLeft size={15} />
          <span>Back</span>
        </button>

        {/* Memory title */}
        <div className="wandr-nav-title" style={{ color: textCol }}>
          {memoryName || "Canvas"}
        </div>

        {/* Right side: save + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onSave && (
            <button
              className="wandr-nav-btn"
              style={{ color: textCol, background: pillBg }}
              onClick={onSave}
              onMouseEnter={(e) => e.currentTarget.style.background = pillHov}
              onMouseLeave={(e) => e.currentTarget.style.background = pillBg}
              aria-label="Save canvas"
            >
              <FiSave size={14} />
              <span>Save</span>
            </button>
          )}

          {avatarUrl && (
            <img
              className="wandr-nav-avatar"
              src={avatarUrl}
              alt="Profile"
              style={{
                border: `2px solid ${subCol}`,
              }}
            />
          )}
        </div>
      </nav>

      {/* Spacer so canvas content starts below the fixed navbar */}
      <div style={{ height: 54, flexShrink: 0 }} />
    </>
  );
}