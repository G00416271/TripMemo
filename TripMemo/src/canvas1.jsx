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

// ── Background layer — inside Konva Stage, pans/zooms for free ────────────────
// ── Background layer — single pattern tile, zero per-element cost ─────────────
function BackgroundLayer({ pattern, bgColor, zoom, size, cam }) {
  if (pattern === "blank") return null;
  if (zoom < 0.25) return null;

  const SPACING = 28;
  const ink = isDarkColor(bgColor)
    ? "rgba(255,255,255,0.18)"
    : "rgba(0,0,0,0.12)";

  // Offset the pattern origin so it pans with the camera
  // cam is in screen-space pixels, pattern is in world-space
  // We need the offset in world-space, then Konva's scaleX/Y does the rest
  const offsetX = (((cam.x / zoom) % SPACING) + SPACING) % SPACING;
  const offsetY = (((cam.y / zoom) % SPACING) + SPACING) % SPACING;

  // Width/height of the SVG we render — cover the full visible area in world coords
  const worldW = size.w / zoom + SPACING * 2;
  const worldH = size.h / zoom + SPACING * 2;

  // Top-left corner in world coords (account for pattern offset)
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
        PEN COLOUR
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PASTEL_COLORS.map((c) => (
          <button
            key={c.value}
            title={c.label}
            onClick={() => onColorChange(c.value)}
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: c.value,
              border:
                currentColor === c.value ? "3px solid #555" : "2px solid #ccc",
              cursor: "pointer",
              flexShrink: 0,
              transform: currentColor === c.value ? "scale(1.25)" : "scale(1)",
              transition: "transform 0.12s",
            }}
          />
        ))}
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

  // camRef mirrors cam — pan handlers (created once) read from here, never stale
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
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [undo, redo, deleteSelected]);

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
      const stage = stageRef.current;
      if (stage) {
        const c = { x: stage.x(), y: stage.y() };
        setCam(c);
        camRef.current = c;
      }
      window.removeEventListener("mousemove", panHandlersRef.current.move);
      window.removeEventListener("mouseup", panHandlersRef.current.up);
    };
  }, []); // once — stable references forever

  function startRightClickPan(e) {
    if (e.evt.button !== 2) return false;
    isPanningRef.current = true;
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
    // Convert Konva pointer to screen coords
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
        `http://localhost:5000/api/canvas/load?memoryId=${memoryId}`,
      );
      if (!res.ok) throw new Error("Load failed");
      const data = await res.json();
      if (reqId !== loadReqRef.current) return;

      console.log("loadCanvas data:", data);
      console.log("bgColor from server:", data?.bgColor);
      console.log("bgPattern from server:", data?.bgPattern);

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
    console.log("saveCanvas called");
    console.log("bgColor:", bgColorRef.current);
    console.log("bgPattern:", bgPatternRef.current);
    console.log("memoryId:", memoryId);
    console.log("items:", items.length);

    try {
      const form = new FormData();
      form.append("memoryId", String(memoryId));
      form.append("cam", JSON.stringify(camRef.current));
      form.append("zoom", String(zoom));
      form.append("bgColor", bgColorRef.current); // ← ref, never stale
      form.append("bgPattern", bgPatternRef.current); // ← ref, never stale
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
      const res = await fetch("http://localhost:5000/api/canvas/save", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Save failed");
    } catch (err) {
      console.error(err);
    }
  }, [memoryId, zoom, tags, items, serverData]);

  // This now only re-runs when saveCanvas actually changes
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

  const zoomBtnStyle = {
    width: 36,
    height: 28,
    border: "1px solid #ddd",
    borderRadius: 6,
    background: "white",
    cursor: "pointer",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#444",
  };

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
        }}
      >
        <div>Ctrl+Z / Ctrl+Shift+Z — Undo / Redo</div>
        <div>Delete / Backspace — Remove selected</div>
        <div>Scroll — Zoom · Right-drag — Pan</div>
        <div>+/−/0 — Zoom in/out/reset</div>
      </div>

      {showPenPicker && (
        <PenColorPicker currentColor={penColor} onColorChange={setPenColor} />
      )}

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
        <button
          onClick={() => handleZoom(0.15)}
          style={zoomBtnStyle}
          title="Zoom in (+)"
        >
          ＋
        </button>
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#666",
            padding: "2px 0",
            minWidth: 36,
          }}
        >
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={() => handleZoom(-0.15)}
          style={zoomBtnStyle}
          title="Zoom out (-)"
        >
          －
        </button>
        <button
          onClick={() => {
            setZoom(1);
            const c = { x: 0, y: 0 };
            setCam(c);
            camRef.current = c;
          }}
          style={{ ...zoomBtnStyle, fontSize: 9 }}
          title="Reset (0)"
        >
          FIT
        </button>
      </div>

      {editingTextId && (
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
            fontSize: `${24 * zoom}px`,
            border: "2px solid dodgerblue",
            borderRadius: 4,
            padding: "2px 6px",
            zIndex: 1000,
            background: "white",
            minWidth: 120,
          }}
        />
      )}

      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          userSelect: "none",
          position: "relative",
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
        {/* ── DEEZER CONTEXT MENU ──────────────────────────────────────────────── */}
        {ctxMenu &&
          (() => {
            const item = items.find((i) => i.id === ctxMenu.id);
            if (!item) return null;
            return (
              <>
                {/* Click-away backdrop */}
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
                  }}
                >
                  {/* ── Frame ── */}
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
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* ── Font family ── */}
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
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* ── Font colour ── */}
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
                        }}
                      />
                    ))}
                    {/* Custom colour picker */}
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
                    }}
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
          {/* Background lives inside Stage — pans & zooms for free, zero extra work */}
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
              />
            )}

            {items.map((it) => {
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
                    stroke={it.id === selectedId ? "dodgerblue" : "black"}
                    strokeWidth={it.id === selectedId ? 2 : 1}
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
                    strokeWidth={3}
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
                    strokeWidth={3}
                    lineCap="round"
                    lineJoin="round"
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
                    fill="black"
                    stroke={it.id === selectedId ? "dodgerblue" : undefined}
                    strokeWidth={it.id === selectedId ? 1 : 0}
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
                    isSelected={it.id === selectedId}
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
                    isSelected={it.id === selectedId}
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
