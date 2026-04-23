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
  Transformer,
} from "react-konva";
import useImage from "use-image";
import { proxy } from "./proxy";
import { FONTS, FRAMES } from "./toolbox/deezercard";
import DeezerCard from "./toolbox/deezercard";

// ── helpers ───────────────────────────────────────────────────────────────────
function isDarkColor(hex) {
  const c = (hex ?? "#ffffff").replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

// Map each tool to the CSS cursor that best describes its current action
function cursorForTool(tool, isPanning) {
  if (isPanning) return "grabbing";
  switch (tool) {
    case "pencil":
    case "line":
    case "rectangle":
      return "crosshair";
    case "text":
      return "text";
    case "eraser":
      return "cell";
    case "selection":
    default:
      return "default";
  }
}

// ── Background layer — inside Konva Stage, pans/zooms for free ────────────────
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
           <defs>
             <pattern id="${patternId}" x="0" y="0"
               width="${SPACING}" height="${SPACING}"
               patternUnits="userSpaceOnUse">
               <circle cx="${SPACING / 2}" cy="${SPACING / 2}"
                 r="1.5" fill="${ink}" />
             </pattern>
           </defs>
           <rect width="100%" height="100%" fill="url(#${patternId})" />
         </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="${worldW}" height="${worldH}">
           <defs>
             <pattern id="${patternId}" x="0" y="0"
               width="${SPACING}" height="${SPACING}"
               patternUnits="userSpaceOnUse">
               <path d="M ${SPACING} 0 L 0 0 0 ${SPACING}"
                 fill="none" stroke="${ink}" stroke-width="0.8" />
             </pattern>
           </defs>
           <rect width="100%" height="100%" fill="url(#${patternId})" />
         </svg>`;

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;

  const [img] = useImage(dataUrl);

  return (
    <KonvaImage
      image={img}
      x={worldX}
      y={worldY}
      width={worldW}
      height={worldH}
      listening={false}
      perfectDrawEnabled={false}
    />
  );
}

// ── Pastel colours ────────────────────────────────────────────────────────────
const PASTEL_COLORS = [
  { label: "Ink", value: "#2d2d2d" },
  { label: "Rose", value: "#F4A7B9" },
  { label: "Peach", value: "#FFCBA4" },
  { label: "Butter", value: "#FFF0A0" },
  { label: "Mint", value: "#B5EAD7" },
  { label: "Sky", value: "#AED9F7" },
  { label: "Lavender", value: "#C5B9F6" },
  { label: "Lilac", value: "#E8C6F0" },
  { label: "Sage", value: "#C8DEBC" },
  { label: "Blush", value: "#F7C5C5" },
];

function PenColorPicker({ currentColor, onColorChange }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div
      style={{
        position: "absolute",
        bottom: 70,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(255,255,255,0.97)",
        border: "1px solid #e0e0e0",
        borderRadius: 12,
        padding: "10px 14px",
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        minWidth: 240,
        animation: "fadeInUp 160ms ease-out",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#888",
          fontWeight: 700,
          letterSpacing: "0.1em",
        }}
      >
        PEN COLOUR {hovered && <span style={{ color: "#555" }}>— {hovered}</span>}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PASTEL_COLORS.map((c) => {
          const isSelected = currentColor === c.value;
          const isHover = hovered === c.label;
          return (
            <button
              key={c.value}
              title={c.label}
              onClick={() => onColorChange(c.value)}
              onMouseEnter={() => setHovered(c.label)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: c.value,
                border: isSelected ? "3px solid #555" : "2px solid #ccc",
                cursor: "pointer",
                flexShrink: 0,
                transform: isSelected
                  ? "scale(1.25)"
                  : isHover
                  ? "scale(1.12)"
                  : "scale(1)",
                transition: "transform 0.12s, box-shadow 0.12s",
                boxShadow: isHover && !isSelected
                  ? "0 2px 6px rgba(0,0,0,0.18)"
                  : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Floating font picker that appears near a selected text object
function TextFontPicker({ currentFont, onFontChange, position }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
        background: "rgba(255,255,255,0.98)",
        border: "1px solid #e0e0e0",
        borderRadius: 10,
        padding: "8px 10px",
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
        minWidth: 180,
        animation: "fadeIn 140ms ease-out",
        pointerEvents: "auto",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          fontSize: 10,
          color: "#888",
          fontWeight: 700,
          letterSpacing: "0.1em",
        }}
      >
        FONT {hovered && <span style={{ color: "#555" }}>— {hovered}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {FONTS.map((f) => {
          const isActive = currentFont === f;
          return (
            <button
              key={f}
              onClick={() => onFontChange(f)}
              onMouseEnter={() => setHovered(f)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                border: isActive ? "2px solid #4a90e2" : "1px solid #ddd",
                background: isActive ? "#e8f0fc" : "#f7f7f7",
                cursor: "pointer",
                fontFamily: f,
                fontSize: 13,
                textAlign: "left",
                color: isActive ? "#2a62c0" : "#333",
                fontWeight: isActive ? 600 : 400,
                transition: "background 0.12s",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CanvasImage({
  it,
  isSelected,
  tool,
  onSelect,
  nodeRef,
  onResize,
  onSmoothDragEnd,
  snap,
}) {
  const actualSrc = it.imageUrl ?? it.src;
  const shouldProxy =
    actualSrc &&
    !actualSrc.startsWith("data:") &&
    !actualSrc.includes("dzcdn.net");
  const [img] = useImage(
    shouldProxy ? proxy(actualSrc) : actualSrc || "",
    "anonymous",
  );
  return (
    <KonvaImage
      ref={nodeRef}
      image={img}
      x={it.x}
      y={it.y}
      width={it.w}
      height={it.h}
      stroke={isSelected ? "dodgerblue" : undefined}
      strokeWidth={isSelected ? 2 : 0}
      shadowColor={isSelected ? "dodgerblue" : undefined}
      shadowBlur={isSelected ? 10 : 0}
      shadowOpacity={isSelected ? 0.4 : 0}
      draggable={tool === "selection"}
      onMouseDown={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onSmoothDragEnd(it.id, e.target)}
      onTransformEnd={(e) => {
        const node = e.target,
          sx = node.scaleX(),
          sy = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onResize(it.id, {
          x: snap(node.x()),
          y: snap(node.y()),
          w: Math.max(5, snap(node.width() * sx)),
          h: Math.max(5, snap(node.height() * sy)),
        });
      }}
    />
  );
}

const normalizeTags = (arr) => [
  ...new Set(
    (arr ?? [])
      .filter((t) => typeof t === "string" && t.trim())
      .map((t) => t.trim()),
  ),
];

// ── Zoom button — extracted so hover/press states aren't repeated inline ──
function ZoomButton({ children, onClick, title, small }) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      title={title}
      style={{
        width: 36,
        height: 28,
        border: "1px solid #ddd",
        borderRadius: 6,
        background: hover ? (pressed ? "#e6e6e6" : "#f5f5f5") : "white",
        cursor: "pointer",
        fontSize: small ? 9 : 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        color: "#444",
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition: "background 0.12s, transform 0.08s",
      }}
    >
      {children}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CanvasPage({
  memoryId,
  memoryName,
  setActiveTab,
  uploadedFiles,
  setUploadedFiles,
  setMemoryTags,
  serverData,
  bgColor,
  bgPattern,
  onBgChange,
  tool,
  saveRef,
  setTool,
}) {
  const trRef = useRef(null);
  const nodeRefs = useRef({});
  const stageRef = useRef(null);
  const textInputRef = useRef(null);
  const panHandlersRef = useRef({});

  const bgColorRef = useRef(bgColor);
  const bgPatternRef = useRef(bgPattern);

  useEffect(() => {
    bgColorRef.current = bgColor;
  }, [bgColor]);
  useEffect(() => {
    bgPatternRef.current = bgPattern;
  }, [bgPattern]);

  const GRID = 20;
  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 4;

  const snap = (v) => Math.round(v / GRID) * GRID;
  const snapXY = (x, y) => ({ x: snap(x), y: snap(y) });

  function tweenToSnap(node, onDone) {
    const { x, y } = snapXY(node.x(), node.y());
    if (x === node.x() && y === node.y()) {
      onDone?.({ x, y });
      return;
    }
    new Konva.Tween({
      node,
      duration: 0.12,
      x,
      y,
      easing: Konva.Easings.EaseOut,
      onFinish: () => onDone?.({ x, y }),
    }).play();
  }

  const [size, setSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  useEffect(() => {
    const onResize = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [canvasLoaded, setCanvasLoaded] = useState(false);
  const [cam, setCam] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const [ctxMenu, setCtxMenu] = useState(null);

  // Session-sticky: user can dismiss the help panel
  const [showHelp, setShowHelp] = useState(true);

  // Track panning in state too so we can update the cursor
  const [isPanningUI, setIsPanningUI] = useState(false);

  const camRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    camRef.current = cam;
  }, [cam]);

  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const lastPinchDistRef = useRef(null);
  const lastPinchMidRef = useRef(null);

  const [penColor, setPenColor] = useState(PASTEL_COLORS[0].value);
  const [showPenPicker, setShowPenPicker] = useState(false);
  useEffect(() => {
    setShowPenPicker(tool === "pencil" || tool === "line");
  }, [tool]);

  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    if (!Array.isArray(serverData) || !serverData.length) return;
    const next = [
      ...new Set(
        serverData
          .filter((t) => typeof t === "string" && t.trim())
          .map((t) => t.trim()),
      ),
    ];
    setTags(next);
    setMemoryTags?.(next);
  }, [serverData, setMemoryTags]);

  const isDrawingRef = useRef(false);
  const drawingIdRef = useRef(null);

  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [editingTextId, setEditingTextId] = useState(null);
  const [editingTextValue, setEditingTextValue] = useState("");
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });

  const nextId = () => crypto.randomUUID();

  const addToHistory = useCallback(
    (newItems) => {
      if (isDrawingRef.current) return;
      setHistory((prev) => {
        const h = prev.slice(0, historyIndex + 1);
        h.push([...newItems]);
        return h.slice(-50);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    },
    [historyIndex],
  );

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = selectedId ? nodeRefs.current[selectedId] : null;
    if (node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, items]);

  const updateItems = useCallback(
    (newItems) => {
      setItems(newItems);
      addToHistory(newItems);
    },
    [addToHistory],
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const i = historyIndex - 1;
      setHistoryIndex(i);
      setItems([...history[i]]);
      setSelectedId(null);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const i = historyIndex + 1;
      setHistoryIndex(i);
      setItems([...history[i]]);
      setSelectedId(null);
    }
  }, [history, historyIndex]);

  const deleteSelected = useCallback(() => {
    if (selectedId) {
      updateItems(items.filter((item) => item.id !== selectedId));
      setSelectedId(null);
    }
  }, [selectedId, items, updateItems]);

  useEffect(() => {
    const down = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey && e.shiftKey && e.key === "Z") ||
        (e.ctrlKey && e.key === "y")
      ) {
        e.preventDefault();
        redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        handleZoom(0.1);
      } else if (e.key === "-") {
        e.preventDefault();
        handleZoom(-0.1);
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1);
        const c = { x: 0, y: 0 };
        setCam(c);
        camRef.current = c;
      } else if (e.key === "Escape") {
        // Quick-dismiss: close context menu and deselect
        if (ctxMenu) setCtxMenu(null);
        else setSelectedId(null);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [undo, redo, deleteSelected, ctxMenu]);

  // ── Zoom ──────────────────────────────────────────────────────────────────
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

  function pointerToWorld(stage) {
    const p = stage.getPointerPosition(),
      c = camRef.current;
    return { x: (p.x - c.x) / zoom, y: (p.y - c.y) / zoom };
  }

  // ── Pan — imperative, zero React renders during drag ─────────────────────
  useEffect(() => {
    panHandlersRef.current.move = (e) => {
      if (!isPanningRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      const stage = stageRef.current;
      if (!stage) return;
      const nx = stage.x() + dx,
        ny = stage.y() + dy;
      stage.x(nx);
      stage.y(ny);
      stage.batchDraw();
      camRef.current = { x: nx, y: ny };
    };
    panHandlersRef.current.up = () => {
      if (!isPanningRef.current) return;
      isPanningRef.current = false;
      setIsPanningUI(false);
      const stage = stageRef.current;
      if (stage) {
        const c = { x: stage.x(), y: stage.y() };
        setCam(c);
        camRef.current = c;
      }
      window.removeEventListener("mousemove", panHandlersRef.current.move);
      window.removeEventListener("mouseup", panHandlersRef.current.up);
    };
  }, []);

  function startRightClickPan(e) {
    if (e.evt.button !== 2) return false;
    isPanningRef.current = true;
    setIsPanningUI(true);
    lastMouseRef.current = { x: e.evt.clientX, y: e.evt.clientY };
    window.removeEventListener("mousemove", panHandlersRef.current.move);
    window.removeEventListener("mouseup", panHandlersRef.current.up);
    window.addEventListener("mousemove", panHandlersRef.current.move);
    window.addEventListener("mouseup", panHandlersRef.current.up);
    return true;
  }

  function handleDeezerRightClick(e, itemId) {
    e.evt.preventDefault();
    e.cancelBubble = true;
    const stage = stageRef.current;
    const container = stage.container().getBoundingClientRect();
    const ptr = stage.getPointerPosition();
    setCtxMenu({
      id: itemId,
      screenX: container.left + ptr.x,
      screenY: container.top + ptr.y,
    });
  }

  function updateDeezerStyle(id, patch) {
    updateItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  // ── Text ──────────────────────────────────────────────────────────────────
  const startEditingText = (item) => {
    const box = stageRef.current.container().getBoundingClientRect();
    setEditingTextId(item.id);
    setEditingTextValue(item.text);
    setTextInputPosition({
      x: box.left + item.x * zoom + cam.x,
      y: box.top + item.y * zoom + cam.y,
    });
    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
        textInputRef.current.select();
      }
    }, 10);
  };

  const finishEditingText = () => {
    if (!editingTextId) return;
    updateItems(
      items.map((item) =>
        item.id === editingTextId
          ? { ...item, text: editingTextValue || "Empty text" }
          : item,
      ),
    );
    setEditingTextId(null);
    setEditingTextValue("");
  };

  // ── Mouse ─────────────────────────────────────────────────────────────────
  function handleMouseDown(e) {
    if (editingTextId) {
      finishEditingText();
      return;
    }
    if (startRightClickPan(e)) return;
    const stage = e.target.getStage(),
      pos = pointerToWorld(stage);
    if (tool === "selection" && e.target === stage) {
      setSelectedId(null);
      return;
    }
    if (tool === "eraser") {
      eraseAtPointer(e);
      return;
    }
    if (tool === "text") {
      const id = nextId();
      const newItems = [
        ...items,
        {
          id,
          type: "text",
          x: pos.x,
          y: pos.y,
          text: "New text",
          fontSize: 24,
          fontFamily: FONTS[0],
        },
      ];
      setItems(newItems);
      setSelectedId(id);
      setTimeout(() => {
        const ni = newItems.find((i) => i.id === id);
        if (ni) startEditingText(ni);
      }, 10);
      return;
    }
    if (tool === "rectangle") {
      const id = nextId();
      isDrawingRef.current = true;
      drawingIdRef.current = id;
      setItems((prev) => [
        ...prev,
        { id, type: "rect", x: pos.x, y: pos.y, w: 1, h: 1 },
      ]);
      setSelectedId(id);
      return;
    }
    if (tool === "line") {
      const id = nextId();
      isDrawingRef.current = true;
      drawingIdRef.current = id;
      setItems((prev) => [
        ...prev,
        {
          id,
          type: "line",
          points: [pos.x, pos.y, pos.x, pos.y],
          color: penColor,
        },
      ]);
      setSelectedId(id);
      return;
    }
    if (tool === "pencil") {
      const id = nextId();
      isDrawingRef.current = true;
      drawingIdRef.current = id;
      setItems((prev) => [
        ...prev,
        { id, type: "pencil", points: [pos.x, pos.y], color: penColor },
      ]);
      setSelectedId(id);
      return;
    }
  }

  function eraseAtPointer(e) {
    const target = e.target;
    if (target === target.getStage()) return;
    const id = target?.attrs?.id;
    if (!id) return;
    updateItems(items.filter((it) => it.id !== id));
    setSelectedId(null);
  }

  function handleMouseMove(e) {
    if (isPanningRef.current) return;
    if (tool === "eraser" && e.evt.buttons === 1) {
      eraseAtPointer(e);
      return;
    }
    if (!isDrawingRef.current) return;
    const pos = pointerToWorld(e.target.getStage()),
      drawId = drawingIdRef.current;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== drawId) return it;
        if (it.type === "rect")
          return { ...it, w: pos.x - it.x, h: pos.y - it.y };
        if (it.type === "line") {
          const [x1, y1] = it.points;
          return { ...it, points: [x1, y1, pos.x, pos.y] };
        }
        if (it.type === "pencil")
          return { ...it, points: [...it.points, pos.x, pos.y] };
        return it;
      }),
    );
  }

  function handleMouseUp(e) {
    if (e?.evt?.button === 2) return;
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      drawingIdRef.current = null;
      setItems((prev) => {
        addToHistory(prev);
        return prev;
      });
      return;
    }
    isDrawingRef.current = false;
    drawingIdRef.current = null;
  }

  // ── Touch ─────────────────────────────────────────────────────────────────
  function handleTouchStart(e) {
    const t = e.evt.touches;
    if (t.length === 2) {
      lastPinchDistRef.current = Math.hypot(
        t[1].clientX - t[0].clientX,
        t[1].clientY - t[0].clientY,
      );
      lastPinchMidRef.current = {
        x: (t[0].clientX + t[1].clientX) / 2,
        y: (t[0].clientY + t[1].clientY) / 2,
      };
    } else if (t.length === 1) {
      isPanningRef.current = true;
      lastMouseRef.current = { x: t[0].clientX, y: t[0].clientY };
    }
  }

  function handleTouchMove(e) {
    const t = e.evt.touches;
    if (t.length === 2 && lastPinchDistRef.current !== null) {
      e.evt.preventDefault();
      const dist = Math.hypot(
        t[1].clientX - t[0].clientX,
        t[1].clientY - t[0].clientY,
      );
      const mid = {
        x: (t[0].clientX + t[1].clientX) / 2,
        y: (t[0].clientY + t[1].clientY) / 2,
      };
      handleZoom(
        (dist / lastPinchDistRef.current - 1) * zoom * 0.02,
        mid.x,
        mid.y,
      );
      if (lastPinchMidRef.current)
        setCam((prev) => ({
          x: prev.x + mid.x - lastPinchMidRef.current.x,
          y: prev.y + mid.y - lastPinchMidRef.current.y,
        }));
      lastPinchDistRef.current = dist;
      lastPinchMidRef.current = mid;
    } else if (t.length === 1 && isPanningRef.current) {
      const dx = t[0].clientX - lastMouseRef.current.x,
        dy = t[0].clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: t[0].clientX, y: t[0].clientY };
      const stage = stageRef.current;
      if (stage) {
        stage.x(stage.x() + dx);
        stage.y(stage.y() + dy);
        stage.batchDraw();
        camRef.current = { x: stage.x(), y: stage.y() };
      }
    }
  }

  function handleTouchEnd() {
    lastPinchDistRef.current = null;
    lastPinchMidRef.current = null;
    if (isPanningRef.current && stageRef.current)
      setCam({ x: stageRef.current.x(), y: stageRef.current.y() });
    isPanningRef.current = false;
  }

  const handleItemDragEnd = (id, newAttrs) =>
    updateItems(
      items.map((item) => (item.id === id ? { ...item, ...newAttrs } : item)),
    );
  function selectItem(id) {
    if (tool !== "selection") return;
    setSelectedId(id);
  }
  const handleTextDoubleClick = (item) => {
    if (tool === "selection") startEditingText(item);
  };

  const addImageFromFile = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result),
          img = new window.Image();
        img.onload = () => {
          const id = crypto.randomUUID(),
            cid = crypto.randomUUID();
          const w = 200,
            h = Math.round((img.height / img.width) * w),
            c = camRef.current;
          setItems((prev) => [
            ...prev,
            {
              id,
              type: "image",
              x:
                (-c.x + size.w / 2) / zoom - w / 2 + (Math.random() - 0.5) * 80,
              y:
                (-c.y + size.h / 2) / zoom - h / 2 + (Math.random() - 0.5) * 80,
              w,
              h,
              src,
              clientImageId: cid,
              _file: file,
            },
          ]);
          setSelectedId(id);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    },
    [zoom, size],
  );

  const loadReqRef = useRef(0);
  const loadCanvas = useCallback(async () => {
    try {
      if (!memoryId) return;
      const reqId = ++loadReqRef.current;
      const res = await fetch(
        `https://tripmemo-11.onrender.com/api/canvas/load?memoryId=${memoryId}`,
      );
      if (!res.ok) throw new Error("Load failed");
      const data = await res.json();
      if (reqId !== loadReqRef.current) return;

      const loadedTags = Array.isArray(data?.tags) ? data.tags : [];
      setTags([...loadedTags]);
      setMemoryTags?.([...loadedTags]);
      setItems(Array.isArray(data?.items) ? data.items : []);
      const lc =
        data?.cam && typeof data.cam === "object" ? data.cam : { x: 0, y: 0 };
      setCam(lc);
      camRef.current = lc;
      setZoom(data?.zoom ?? 1);
      onBgChange?.({
        bgColor: data?.bgColor ?? "#ffffff",
        bgPattern: data?.bgPattern ?? "blank",
      });
      setSelectedId(null);
      setHistory([Array.isArray(data?.items) ? data.items : []]);
      setHistoryIndex(0);
      setCanvasLoaded(true);
    } catch (err) {
      console.error("loadCanvas error:", err);
    }
  }, [memoryId, setMemoryTags]);

  useEffect(() => {
    setCanvasLoaded(false);
    setItems([]);
    setSelectedId(null);
    const rc = { x: 0, y: 0 };
    setCam(rc);
    camRef.current = rc;
    setZoom(1);
    loadCanvas();
  }, [memoryId, loadCanvas]);

  const addedOnceRef = useRef(false);
  useEffect(() => {
    addedOnceRef.current = false;
  }, [memoryId, uploadedFiles]);
  useEffect(() => {
    if (!canvasLoaded || addedOnceRef.current || !uploadedFiles?.length) return;
    uploadedFiles.forEach(addImageFromFile);
    addedOnceRef.current = true;
    setUploadedFiles([]);
  }, [canvasLoaded, uploadedFiles, addImageFromFile, setUploadedFiles]);

  const saveCanvas = useCallback(async () => {
    try {
      const form = new FormData();
      form.append("memoryId", String(memoryId));
      form.append("cam", JSON.stringify(camRef.current));
      form.append("zoom", String(zoom));
      form.append("bgColor", bgColorRef.current);
      form.append("bgPattern", bgPatternRef.current);
      form.append(
        "tags",
        JSON.stringify(tags.length ? tags : normalizeTags(serverData)),
      );
      const cleaned = items.map((it) => {
        if (it.type !== "image") return it;
        const { _file, ...rest } = it;
        if (typeof rest.src === "string" && rest.src.startsWith("data:"))
          delete rest.src;
        return rest;
      });
      form.append("items", JSON.stringify(cleaned));
      items.forEach((it) => {
        if (it.type === "image" && it._file && it.clientImageId)
          form.append(
            "images",
            new File([it._file], it.clientImageId, { type: it._file.type }),
          );
      });
      const res = await fetch("https://tripmemo-11.onrender.com/api/canvas/save", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Save failed");
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, [memoryId, zoom, tags, items, serverData]);

  useEffect(() => {
    if (saveRef) saveRef.current = saveCanvas;
  }, [saveCanvas]);

  function screenToWorld(stage, clientX, clientY) {
    const rect = stage.container().getBoundingClientRect(),
      c = camRef.current;
    return {
      x: (clientX - rect.left - c.x) / zoom,
      y: (clientY - rect.top - c.y) / zoom,
    };
  }

  function addImageFromUrl(src, x, y) {
    if (!src) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const id = nextId(),
        w = 200,
        h = Math.round((img.height / img.width) * w);
      setItems((prev) => {
        const next = [
          ...prev,
          { id, type: "image", x: x - w / 2, y: y - h / 2, w, h, src },
        ];
        addToHistory(next);
        return next;
      });
      setSelectedId(id);
    };
    img.src = proxy(src);
  }

  const stageCursor = cursorForTool(tool, isPanningUI);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        overflow: "hidden",
        position: "relative",
        background: bgColor,
        touchAction: "none",
      }}
    >
      {/* Scoped keyframes for little fade-ins */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 6px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          top: 10,
          left: 180,
          zIndex: 1000,
          background: "rgba(255,255,255,0.9)",
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: 13,
        }}
      >
        {memoryName} (#{memoryId})
      </div>

      {/* Help panel — dismissible */}
      {showHelp ? (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(0,0,0,0.6)",
            color: "white",
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 11,
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxWidth: 260,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <span style={{ fontWeight: 700, letterSpacing: "0.05em" }}>
              SHORTCUTS
            </span>
            <button
              onClick={() => setShowHelp(false)}
              title="Hide shortcuts"
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.8)",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
                padding: "0 2px",
              }}
            >
              ×
            </button>
          </div>
          <div>Ctrl+Z / Ctrl+Shift+Z — Undo / Redo</div>
          <div>Delete / Backspace — Remove selected</div>
          <div>Scroll — Zoom · Right-drag — Pan</div>
          <div>+/−/0 — Zoom in/out/reset · Esc — Deselect</div>
        </div>
      ) : (
        <button
          onClick={() => setShowHelp(true)}
          title="Show keyboard shortcuts"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(0,0,0,0.6)",
            color: "white",
            border: "none",
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 11,
            zIndex: 1000,
            cursor: "pointer",
          }}
        >
          ?
        </button>
      )}

      {showPenPicker && (
        <PenColorPicker currentColor={penColor} onColorChange={setPenColor} />
      )}

      {/* Font picker — floats above selected text when using Selection tool */}
      {(() => {
        if (tool !== "selection") return null;
        if (!selectedId || editingTextId) return null;
        const sel = items.find((i) => i.id === selectedId);
        if (!sel || sel.type !== "text") return null;
        const stage = stageRef.current;
        if (!stage) return null;
        const box = stage.container().getBoundingClientRect();
        // Position the picker above the text, centred horizontally
        const screenX = box.left + sel.x * zoom + cam.x;
        const screenY = box.top + sel.y * zoom + cam.y - 12;
        return (
          <TextFontPicker
            currentFont={sel.fontFamily ?? FONTS[0]}
            onFontChange={(f) =>
              updateItems(
                items.map((it) =>
                  it.id === selectedId ? { ...it, fontFamily: f } : it,
                ),
              )
            }
            position={{ x: screenX, y: screenY }}
          />
        );
      })()}

      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          background: "rgba(255,255,255,0.95)",
          border: "1px solid #e0e0e0",
          borderRadius: 10,
          padding: 6,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <ZoomButton onClick={() => handleZoom(0.15)} title="Zoom in (+)">
          ＋
        </ZoomButton>
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#666",
            padding: "2px 0",
            minWidth: 36,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(zoom * 100)}%
        </div>
        <ZoomButton onClick={() => handleZoom(-0.15)} title="Zoom out (-)">
          －
        </ZoomButton>
        <ZoomButton
          small
          onClick={() => {
            setZoom(1);
            const c = { x: 0, y: 0 };
            setCam(c);
            camRef.current = c;
          }}
          title="Reset zoom and pan (0)"
        >
          FIT
        </ZoomButton>
      </div>

      {editingTextId && (() => {
        const editItem = items.find((i) => i.id === editingTextId);
        const editFont = editItem?.fontFamily ?? FONTS[0];
        const editSize = editItem?.fontSize ?? 24;
        return (
          <input
            ref={textInputRef}
            type="text"
            value={editingTextValue}
            onChange={(e) => setEditingTextValue(e.target.value)}
            onBlur={finishEditingText}
            onKeyDown={(e) => {
              if (e.key === "Enter") finishEditingText();
              if (e.key === "Escape") {
                setEditingTextId(null);
                setEditingTextValue("");
              }
            }}
            style={{
              position: "fixed",
              left: textInputPosition.x,
              top: textInputPosition.y,
              fontSize: `${editSize * zoom}px`,
              fontFamily: editFont,
              border: "2px solid dodgerblue",
              borderRadius: 4,
              padding: "2px 6px",
              zIndex: 1000,
              background: "white",
              minWidth: 120,
              outline: "none",
              boxShadow: "0 2px 8px rgba(30,144,255,0.25)",
            }}
          />
        );
      })()}

      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          userSelect: "none",
          position: "relative",
          cursor: stageCursor,
        }}
        onContextMenu={(e) => e.preventDefault()}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          let data = null;
          try {
            data = JSON.parse(e.dataTransfer.getData("application/json"));
          } catch {}
          const stage = stageRef.current;
          if (!stage) return;
          const pos = screenToWorld(stage, e.clientX, e.clientY);
          const src =
            e.dataTransfer.getData("text/uri-list") ||
            e.dataTransfer.getData("text/plain");
          if (data?.type === "deezer-track") {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              const id = nextId();
              const w = 200;
              const h = 200;
              setItems((prev) => {
                const next = [
                  ...prev,
                  {
                    id,
                    type: "deezer",
                    x: pos.x - w / 2,
                    y: pos.y - h / 2,
                    w,
                    h,
                    src: data.image,
                    title: data.title,
                    artist: data.artist,
                    frame: data.frame ?? "none",
                    fontFamily: data.fontFamily ?? "Arial",
                    fontColor: data.fontColor ?? "#000000",
                  },
                ];
                addToHistory(next);
                return next;
              });
              setSelectedId(id);
            };
            img.src = data.image;
            return;
          }
          if (src) addImageFromUrl(proxy(src), pos.x, pos.y);
        }}
      >
        {/* ── DEEZER CONTEXT MENU ──────────────────────────────────────── */}
        {ctxMenu &&
          (() => {
            const item = items.find((i) => i.id === ctxMenu.id);
            if (!item) return null;
            return (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 1299 }}
                  onClick={() => setCtxMenu(null)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCtxMenu(null);
                  }}
                />
                <div
                  style={{
                    position: "fixed",
                    left: ctxMenu.screenX,
                    top: ctxMenu.screenY,
                    zIndex: 1300,
                    background: "#ffffff",
                    border: "1px solid #e0e0e0",
                    borderRadius: 12,
                    padding: "14px 16px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    minWidth: 220,
                    fontFamily: "system-ui, sans-serif",
                    fontSize: 13,
                    transformOrigin: "top left",
                    animation: "fadeIn 140ms ease-out",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      color: "#999",
                      marginBottom: 8,
                    }}
                  >
                    FRAME
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginBottom: 14,
                    }}
                  >
                    {FRAMES.map((f) => (
                      <button
                        key={f.id}
                        onClick={() =>
                          updateDeezerStyle(ctxMenu.id, { frame: f.id })
                        }
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border:
                            item.frame === f.id
                              ? "2px solid #4a90e2"
                              : "1px solid #ddd",
                          background:
                            item.frame === f.id ? "#e8f0fc" : "#f7f7f7",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: item.frame === f.id ? 600 : 400,
                          color: item.frame === f.id ? "#2a62c0" : "#333",
                          transition: "background 0.12s",
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      color: "#999",
                      marginBottom: 8,
                    }}
                  >
                    FONT
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      marginBottom: 14,
                    }}
                  >
                    {FONTS.map((f) => (
                      <button
                        key={f}
                        onClick={() =>
                          updateDeezerStyle(ctxMenu.id, { fontFamily: f })
                        }
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          border:
                            item.fontFamily === f
                              ? "2px solid #4a90e2"
                              : "1px solid #ddd",
                          background:
                            item.fontFamily === f ? "#e8f0fc" : "#f7f7f7",
                          cursor: "pointer",
                          fontFamily: f,
                          fontSize: 13,
                          textAlign: "left",
                          color: item.fontFamily === f ? "#2a62c0" : "#333",
                          transition: "background 0.12s",
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      color: "#999",
                      marginBottom: 8,
                    }}
                  >
                    FONT COLOUR
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    {[
                      "#000000",
                      "#ffffff",
                      "#ff4444",
                      "#4a90e2",
                      "#f5a623",
                      "#7ed321",
                      "#9b59b6",
                    ].map((c) => (
                      <button
                        key={c}
                        onClick={() =>
                          updateDeezerStyle(ctxMenu.id, { fontColor: c })
                        }
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: c,
                          border:
                            item.fontColor === c
                              ? "3px solid #4a90e2"
                              : "2px solid #ccc",
                          cursor: "pointer",
                          flexShrink: 0,
                          transform:
                            item.fontColor === c ? "scale(1.2)" : "scale(1)",
                          transition: "transform 0.12s",
                        }}
                      />
                    ))}
                    <label
                      style={{
                        position: "relative",
                        width: 24,
                        height: 24,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background:
                            "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
                          border: "2px solid #ccc",
                        }}
                      />
                      <input
                        type="color"
                        defaultValue={item.fontColor ?? "#000000"}
                        onChange={(e) =>
                          updateDeezerStyle(ctxMenu.id, {
                            fontColor: e.target.value,
                          })
                        }
                        style={{
                          position: "absolute",
                          opacity: 0,
                          inset: 0,
                          cursor: "pointer",
                        }}
                      />
                    </label>
                  </div>

                  <button
                    onClick={() => setCtxMenu(null)}
                    style={{
                      width: "100%",
                      padding: "6px 0",
                      borderRadius: 7,
                      border: "1px solid #eee",
                      background: "#f5f5f5",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "#666",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#ebebeb")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#f5f5f5")
                    }
                  >
                    Close
                  </button>
                </div>
              </>
            );
          })()}
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          x={cam.x}
          y={cam.y}
          scaleX={zoom}
          scaleY={zoom}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => e.evt.preventDefault()}
        >
          <Layer listening={false}>
            <BackgroundLayer
              pattern={bgPattern}
              bgColor={bgColor}
              zoom={zoom}
              size={size}
              cam={cam}
            />
          </Layer>

          <Layer>
            {tool === "selection" && (
              <Transformer
                ref={trRef}
                keepRatio={["image", "deezer"].includes(
                  items.find((i) => i.id === selectedId)?.type,
                )}
                anchorStroke="#4a90e2"
                anchorFill="#ffffff"
                anchorSize={8}
                anchorCornerRadius={2}
                borderStroke="#4a90e2"
                borderDash={[4, 4]}
              />
            )}

            {items.map((it) => {
              const isSel = it.id === selectedId;
              if (it.type === "rect")
                return (
                  <Rect
                    key={it.id}
                    id={it.id}
                    ref={(n) => (nodeRefs.current[it.id] = n)}
                    x={it.x}
                    y={it.y}
                    width={it.w}
                    height={it.h}
                    fill="transparent"
                    stroke={isSel ? "dodgerblue" : "black"}
                    strokeWidth={isSel ? 2 : 1}
                    shadowColor={isSel ? "dodgerblue" : undefined}
                    shadowBlur={isSel ? 8 : 0}
                    shadowOpacity={isSel ? 0.35 : 0}
                    draggable={tool === "selection"}
                    onMouseDown={() => selectItem(it.id)}
                    onTap={() => selectItem(it.id)}
                    onDragEnd={(e) => {
                      const n = e.target;
                      tweenToSnap(n, ({ x, y }) =>
                        handleItemDragEnd(it.id, { x, y }),
                      );
                    }}
                    onTransformEnd={(e) => {
                      const n = e.target,
                        sx = n.scaleX(),
                        sy = n.scaleY();
                      n.scaleX(1);
                      n.scaleY(1);
                      handleItemDragEnd(it.id, {
                        x: snap(n.x()),
                        y: snap(n.y()),
                        w: Math.max(5, snap(n.width() * sx)),
                        h: Math.max(5, snap(n.height() * sy)),
                      });
                    }}
                  />
                );
              if (it.type === "line")
                return (
                  <Line
                    key={it.id}
                    id={it.id}
                    points={it.points}
                    stroke={it.color ?? "#2d2d2d"}
                    strokeWidth={isSel ? 4 : 3}
                    shadowColor={isSel ? "dodgerblue" : undefined}
                    shadowBlur={isSel ? 6 : 0}
                    shadowOpacity={isSel ? 0.4 : 0}
                    draggable={tool === "selection"}
                    onMouseDown={() => selectItem(it.id)}
                    onTap={() => selectItem(it.id)}
                    onDragEnd={(e) => {
                      const n = e.target,
                        dx = n.x(),
                        dy = n.y();
                      const pts = it.points.map((v, i) =>
                        i % 2 === 0 ? snap(v + dx) : snap(v + dy),
                      );
                      new Konva.Tween({
                        node: n,
                        duration: 0.12,
                        x: 0,
                        y: 0,
                        easing: Konva.Easings.EaseOut,
                        onFinish: () =>
                          handleItemDragEnd(it.id, { points: pts }),
                      }).play();
                    }}
                  />
                );
              if (it.type === "pencil")
                return (
                  <Line
                    key={it.id}
                    id={it.id}
                    points={it.points}
                    stroke={it.color ?? "#2d2d2d"}
                    strokeWidth={isSel ? 4 : 3}
                    lineCap="round"
                    lineJoin="round"
                    shadowColor={isSel ? "dodgerblue" : undefined}
                    shadowBlur={isSel ? 6 : 0}
                    shadowOpacity={isSel ? 0.4 : 0}
                    draggable={tool === "selection"}
                    onMouseDown={() => selectItem(it.id)}
                    onTap={() => selectItem(it.id)}
                    onDragEnd={(e) => {
                      const n = e.target,
                        dx = n.x(),
                        dy = n.y();
                      const pts = it.points.map((v, i) =>
                        i % 2 === 0 ? snap(v + dx) : snap(v + dy),
                      );
                      new Konva.Tween({
                        node: n,
                        duration: 0.12,
                        x: 0,
                        y: 0,
                        easing: Konva.Easings.EaseOut,
                        onFinish: () =>
                          handleItemDragEnd(it.id, { points: pts }),
                      }).play();
                    }}
                  />
                );
              if (it.type === "text")
                return (
                  <Text
                    key={it.id}
                    id={it.id}
                    ref={(n) => (nodeRefs.current[it.id] = n)}
                    x={it.x}
                    y={it.y}
                    text={it.text}
                    fontSize={it.fontSize ?? 24}
                    fontFamily={it.fontFamily ?? FONTS[0]}
                    fill="black"
                    stroke={isSel ? "dodgerblue" : undefined}
                    strokeWidth={isSel ? 1 : 0}
                    shadowColor={isSel ? "dodgerblue" : undefined}
                    shadowBlur={isSel ? 6 : 0}
                    shadowOpacity={isSel ? 0.3 : 0}
                    draggable={tool === "selection"}
                    onMouseDown={() => selectItem(it.id)}
                    onTap={() => selectItem(it.id)}
                    onDblClick={() => handleTextDoubleClick(it)}
                    onDblTap={() => handleTextDoubleClick(it)}
                    onDragEnd={(e) =>
                      handleItemDragEnd(it.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                      })
                    }
                    onTransformEnd={(e) => {
                      const n = e.target,
                        sy = n.scaleY();
                      n.scaleX(1);
                      n.scaleY(1);
                      handleItemDragEnd(it.id, {
                        x: snap(n.x()),
                        y: snap(n.y()),
                        fontSize: Math.max(8, snap((it.fontSize ?? 24) * sy)),
                      });
                    }}
                  />
                );
              if (it.type === "image")
                return (
                  <CanvasImage
                    key={it.id}
                    it={it}
                    isSelected={isSel}
                    tool={tool}
                    onSelect={() => selectItem(it.id)}
                    onSmoothDragEnd={(id, node) => {
                      tweenToSnap(node, ({ x, y }) =>
                        handleItemDragEnd(id, { x, y }),
                      );
                    }}
                    onResize={handleItemDragEnd}
                    nodeRef={(n) => (nodeRefs.current[it.id] = n)}
                    snap={snap}
                  />
                );
              if (it.type === "deezer")
                return (
                  <DeezerCard
                    key={it.id}
                    it={it}
                    isSelected={isSel}
                    tool={tool}
                    onSelect={() => selectItem(it.id)}
                    onDragEnd={(e) =>
                      handleItemDragEnd(it.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                      })
                    }
                    onContextMenu={(e) => handleDeezerRightClick(e, it.id)}
                    onResize={handleItemDragEnd}
                    snap={snap}
                    nodeRef={(n) => (nodeRefs.current[it.id] = n)}
                  />
                );
              return null;
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}