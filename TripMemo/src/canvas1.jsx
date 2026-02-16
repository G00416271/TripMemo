import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Stage,
  Layer,
  Rect,
  Line,
  Text,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import useImage from "use-image";
import Tools from "./toolbox/toolbar.jsx";
import UploadFiles from "./uploadFiles.jsx";

function CanvasImage({
  it,
  isSelected,
  tool,
  onSelect,
  onDragEnd,
  nodeRef,
  onResize,
}) {
  const [img] = useImage(it.src, "anonymous");
  if (!img) return null;

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
      onDragEnd={(e) => onDragEnd(it.id, { x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        onResize(it.id, {
          x: node.x(),
          y: node.y(),
          w: Math.max(5, node.width() * scaleX),
          h: Math.max(5, node.height() * scaleY),
        });
      }}
    />
  );
}

export default function CanvasPage({
  memoryId,
  memoryName,
  setActiveTab,
  uploadedFiles,
  setUploadedFiles,
}) {
  const trRef = useRef(null);
  const nodeRefs = useRef({}); // stores refs for each item by id

  const viewW = "100vw";
  const viewH = "100vh";

  // which tool is selected from your toolbox
  const [tool, setTool] = useState("selection");
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

  // camera (right-click pan)
  const [cam, setCam] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // canvas items
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // drawing state
  const isDrawingRef = useRef(false);
  const drawingIdRef = useRef(null);

  // history for undo/redo
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // text editing
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingTextValue, setEditingTextValue] = useState("");
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });

  const stageRef = useRef(null);
  const textInputRef = useRef(null);
  const nextId = () => crypto.randomUUID();

  // Add to history when items change (but not during drawing)
  const addToHistory = useCallback(
    (newItems) => {
      if (isDrawingRef.current) return; // Don't add to history while drawing

      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push([...newItems]);
        return newHistory.slice(-50); // Keep last 50 states
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

  // Update items and add to history
  const updateItems = useCallback(
    (newItems) => {
      setItems(newItems);
      addToHistory(newItems);
    },
    [addToHistory],
  );

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setItems([...history[newIndex]]);
      setSelectedId(null);
    }
  }, [history, historyIndex]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setItems([...history[newIndex]]);
      setSelectedId(null);
    }
  }, [history, historyIndex]);

  // Delete selected item
  const deleteSelected = useCallback(() => {
    if (selectedId) {
      const newItems = items.filter((item) => item.id !== selectedId);
      updateItems(newItems);
      setSelectedId(null);
    }
  }, [selectedId, items, updateItems]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default if we're not editing text
      if (editingTextId) return;

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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, deleteSelected, editingTextId]);

  // Convert screen pointer -> world coords (accounts for cam)
  function pointerToWorld(stage) {
    const p = stage.getPointerPosition();
    return { x: p.x - cam.x, y: p.y - cam.y };
  }

  function startRightClickPan(e) {
    if (e.evt.button === 2) {
      isPanningRef.current = true;
      lastMouseRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      return true;
    }
    return false;
  }

  // Start editing text
  const startEditingText = (item) => {
    const stage = stageRef.current;
    const stageBox = stage.container().getBoundingClientRect();

    setEditingTextId(item.id);
    setEditingTextValue(item.text);
    setTextInputPosition({
      x: stageBox.left + item.x + cam.x,
      y: stageBox.top + item.y + cam.y,
    });

    // Focus the input after a brief delay
    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
        textInputRef.current.select();
      }
    }, 10);
  };

  // Finish editing text
  const finishEditingText = () => {
    if (editingTextId) {
      const newItems = items.map((item) =>
        item.id === editingTextId
          ? { ...item, text: editingTextValue || "Empty text" }
          : item,
      );
      updateItems(newItems);
      setEditingTextId(null);
      setEditingTextValue("");
    }
  };

  function handleMouseDown(e) {
    // If we're editing text, finish editing
    if (editingTextId) {
      finishEditingText();
      return;
    }

    // right click pan
    if (startRightClickPan(e)) return;

    const stage = e.target.getStage();
    const pos = pointerToWorld(stage);

    // click empty space clears selection
    if (tool === "selection" && e.target === stage) {
      setSelectedId(null);
      return;
    }

    if (tool === "eraser") {
      eraseAtPointer(e);
      return;
    }

    // TEXT: click to place a text item
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

      // Start editing the new text immediately
      setTimeout(() => {
        const newItem = newItems.find((item) => item.id === id);
        if (newItem) {
          startEditingText(newItem);
        }
      }, 10);
      return;
    }

    // RECTANGLE: click+drag to size
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

    // LINE: click+drag to set end point
    if (tool === "line") {
      const id = nextId();
      isDrawingRef.current = true;
      drawingIdRef.current = id;

      setItems((prev) => [
        ...prev,
        { id, type: "line", points: [pos.x, pos.y, pos.x, pos.y] },
      ]);
      setSelectedId(id);
      return;
    }

    // PENCIL: freehand points
    if (tool === "pencil") {
      const id = nextId();
      isDrawingRef.current = true;
      drawingIdRef.current = id;

      setItems((prev) => [
        ...prev,
        { id, type: "pencil", points: [pos.x, pos.y] },
      ]);
      setSelectedId(id);
      return;
    }
  }

  function eraseAtPointer(e) {
    const target = e.target;
    const stage = target.getStage();

    // clicked empty space -> nothing to erase
    if (target === stage) return;

    const id = target?.attrs?.id;
    if (!id) return;

    const newItems = items.filter((it) => it.id !== id);
    updateItems(newItems);
    setSelectedId(null);
  }

  function handleMouseMove(e) {
    // pan
    if (isPanningRef.current) {
      const now = { x: e.evt.clientX, y: e.evt.clientY };
      const dx = now.x - lastMouseRef.current.x;
      const dy = now.y - lastMouseRef.current.y;
      lastMouseRef.current = now;
      setCam((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      return;
    }
    if (tool === "eraser" && e.evt.buttons === 1) {
      eraseAtPointer(e);
      return;
    }

    // drawing updates
    if (!isDrawingRef.current) return;

    const stage = e.target.getStage();
    const pos = pointerToWorld(stage);
    const drawId = drawingIdRef.current;

    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== drawId) return it;

        if (it.type === "rect") {
          return { ...it, w: pos.x - it.x, h: pos.y - it.y };
        }

        if (it.type === "line") {
          const [x1, y1] = it.points;
          return { ...it, points: [x1, y1, pos.x, pos.y] };
        }

        if (it.type === "pencil") {
          return { ...it, points: [...it.points, pos.x, pos.y] };
        }

        return it;
      }),
    );
  }

  function handleMouseUp() {
    isPanningRef.current = false;

    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      drawingIdRef.current = null;

      // push the latest items into history
      setItems((prev) => {
        addToHistory(prev);
        return prev;
      });

      setTool("selection");

      return;
    }

    isDrawingRef.current = false;
    drawingIdRef.current = null;
  }

  // Handle item dragging
  const handleItemDragEnd = (id, newAttrs) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, ...newAttrs } : item,
    );
    updateItems(newItems);
  };

  // selection clicking on items
  function selectItem(id) {
    if (tool !== "selection") return; // only select when selection tool is active
    setSelectedId(id);
  }

  // Double click to edit text
  const handleTextDoubleClick = (item) => {
    if (tool === "selection") {
      startEditingText(item);
    }
  };
  const addImageFromFile = useCallback(
    (file) => {
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);

        const img = new window.Image();
        img.onload = () => {
          const id = nextId();
          const w = 200;
          const h = Math.round((img.height / img.width) * w);

          const newItem = {
            id,
            type: "image",
            x: -cam.x + 50,
            y: -cam.y + 50,
            w,
            h,
            src,
          };

          // ✅ always append to the latest items
          setItems((prev) => {
            const next = [...prev, newItem];
            addToHistory(next);
            return next;
          });

          setSelectedId(id);
        };

        img.src = src;
      };

      reader.readAsDataURL(file);
    },
    [cam, addToHistory], // ✅ NO items, NO updateItems
  );

  const loadReqRef = useRef(0);

  async function loadCanvas() {
    try {
      if (!memoryId) return;

      // every load gets a new id
      const reqId = ++loadReqRef.current;

      const res = await fetch(
        `http://localhost:5000/api/canvas/load?memoryId=${memoryId}`,
      );
      if (!res.ok) throw new Error("Load failed");

      const data = await res.json();

      // if another load started after this one, ignore this result
      if (reqId !== loadReqRef.current) return;

      setItems(data.items ?? []);
      setCam(data.cam ?? { x: 0, y: 0 });
      setSelectedId(null);

      setHistory([data.items ?? []]);
      setHistoryIndex(0);
      setCanvasLoaded(true);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    setCanvasLoaded(false);
    loadCanvas();
    console.log("memoryid: " + memoryId + "memory name: " + memoryName);
  }, [memoryId]);

  const addedOnceRef = useRef(false);
  useEffect(() => {
    addedOnceRef.current = false;
  }, [memoryId, uploadedFiles]);

  useEffect(() => {
    if (!canvasLoaded) return;
    if (addedOnceRef.current) return;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    uploadedFiles.forEach(addImageFromFile);
    addedOnceRef.current = true;

    setUploadedFiles([]); // ✅ clear staged uploads
  }, [canvasLoaded, uploadedFiles, addImageFromFile, setUploadedFiles]); // ✅ add here

  async function saveCanvas() {
    try {
      const res = await fetch("http://localhost:5000/api/canvas/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memoryId, // ✅ add this
          items,
          cam,
          updatedAt: Date.now(),
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      console.log("Saved:", data);
    } catch (err) {
      console.error(err);
    }
  }

  function screenToWorld(stage, clientX, clientY) {
    const rect = stage.container().getBoundingClientRect();
    const xOnStage = clientX - rect.left;
    const yOnStage = clientY - rect.top;

    // Stage is drawn with x={cam.x}, y={cam.y}
    // so world = screen - cam
    return { x: xOnStage - cam.x, y: yOnStage - cam.y };
  }

  function addImageFromUrl(src, x, y) {
    if (!src) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous"; // helps with CORS (Pixabay usually OK)
    img.onload = () => {
      const id = nextId();
      const w = 200;
      const h = Math.round((img.height / img.width) * w);

      const newItem = {
        id,
        type: "image",
        x,
        y,
        w,
        h,
        src,
      };

      setItems((prev) => {
        const next = [...prev, newItem];
        addToHistory(next);
        return next;
      });

      setSelectedId(id);
    };
    img.src = src;
  }

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Tools
        tool={tool}
        setTool={setTool}
        onSave={saveCanvas}
        setActiveTab={setActiveTab}
        onPickFiles={(files) => files.forEach(addImageFromFile)}
      />

      <div
        style={{
          position: "absolute",
          top: 10,
          left: 180,
          zIndex: 1000,
          background: "white",
          padding: 6,
        }}
      >
        {memoryName} (#{memoryId})
      </div>

      {/* Status bar showing keyboard shortcuts */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "8px",
          borderRadius: "4px",
          fontSize: "12px",
          zIndex: 1000,
        }}
      >
        <div>Ctrl+Z: Undo | Ctrl+Shift+Z: Redo</div>
        <div>Delete/Backspace: Delete selected</div>
        <div>Double-click text to edit</div>
      </div>

      {/* Image upload
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000 }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            addImageFromFile(e.target.files?.[0]);
            e.target.value = ""; // clears file so same image can be selected again
          }}
        />
      </div> */}

      {/* Text editing input */}
      {editingTextId && (
        <input
          ref={textInputRef}
          type="text"
          value={editingTextValue}
          onChange={(e) => setEditingTextValue(e.target.value)}
          onBlur={finishEditingText}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              finishEditingText();
            } else if (e.key === "Escape") {
              setEditingTextId(null);
              setEditingTextValue("");
            }
          }}
          style={{
            position: "fixed",
            left: textInputPosition.x,
            top: textInputPosition.y,
            fontSize: "24px",
            border: "2px solid dodgerblue",
            borderRadius: "4px",
            padding: "2px 6px",
            zIndex: 1000,
            background: "white",
          }}
        />
      )}

      {/* Canvas */}
      <div
        style={{
          width: "100vw",
          height: "100vh",
          border: "1px solid #cccccc86",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        <div
          style={{
            width: "100vw",
            height: "100vh",
            border: "1px solid #cccccc86",
            overflow: "hidden",
            userSelect: "none",
          }}
          onDragOver={(e) => {
            e.preventDefault(); // REQUIRED or drop won't fire
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(e) => {
            e.preventDefault();

            const src =
              e.dataTransfer.getData("text/uri-list") ||
              e.dataTransfer.getData("text/plain");

            const stage = stageRef.current;
            if (!stage || !src) return;

            const pos = screenToWorld(stage, e.clientX, e.clientY);
            addImageFromUrl(src, pos.x, pos.y);
          }}
        >
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          x={cam.x}
          y={cam.y}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <Layer>
            {tool === "selection" && (
              <Transformer
                ref={trRef}
                keepRatio={
                  items.find((i) => i.id === selectedId)?.type === "image"
                }
              />
            )}

            {items.map((it) => {
              if (it.type === "rect") {
                return (
                  <Rect
                    id={it.id}
                    ref={(node) => (nodeRefs.current[it.id] = node)}
                    key={it.id}
                    x={it.x}
                    y={it.y}
                    width={it.w}
                    height={it.h}
                    fill="transparent"
                    stroke={it.id === selectedId ? "dodgerblue" : "black"}
                    strokeWidth={it.id === selectedId ? 2 : 1}
                    draggable={tool === "selection"}
                    onMouseDown={() => selectItem(it.id)}
                    onDragEnd={(e) =>
                      handleItemDragEnd(it.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                      })
                    }
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();

                      node.scaleX(1);
                      node.scaleY(1);

                      handleItemDragEnd(it.id, {
                        x: node.x(),
                        y: node.y(),
                        w: Math.max(5, node.width() * scaleX),
                        h: Math.max(5, node.height() * scaleY),
                      });
                    }}
                  />
                );
              }

              if (it.type === "line") {
                return (
                  <Line
                    id={it.id}
                    key={it.id}
                    points={it.points}
                    stroke="black"
                    strokeWidth={3}
                    draggable={tool === "selection"}
                    onMouseDown={() => selectItem(it.id)}
                    onDragEnd={(e) => {
                      const [x1, y1, x2, y2] = it.points;
                      const dx = e.target.x();
                      const dy = e.target.y();
                      handleItemDragEnd(it.id, {
                        points: [x1 + dx, y1 + dy, x2 + dx, y2 + dy],
                      });
                      e.target.x(0);
                      e.target.y(0);
                    }}
                  />
                );
              }

              if (it.type === "pencil") {
                return (
                  <Line
                    id={it.id}
                    key={it.id}
                    points={it.points}
                    stroke="black"
                    strokeWidth={3}
                    lineCap="round"
                    lineJoin="round"
                    draggable={tool === "selection"}
                    onMouseDown={() => selectItem(it.id)}
                    onDragEnd={(e) => {
                      const dx = e.target.x();
                      const dy = e.target.y();
                      const newPoints = [];
                      for (let i = 0; i < it.points.length; i += 2) {
                        newPoints.push(
                          it.points[i] + dx,
                          it.points[i + 1] + dy,
                        );
                      }
                      handleItemDragEnd(it.id, { points: newPoints });
                      e.target.x(0);
                      e.target.y(0);
                    }}
                  />
                );
              }

              if (it.type === "text") {
                return (
                  <Text
                    id={it.id}
                    ref={(node) => (nodeRefs.current[it.id] = node)}
                    key={it.id}
                    x={it.x}
                    y={it.y}
                    text={it.text}
                    fontSize={it.fontSize ?? 24}
                    fill="black"
                    stroke={it.id === selectedId ? "dodgerblue" : undefined}
                    strokeWidth={it.id === selectedId ? 1 : 0}
                    draggable={tool === "selection"}
                    onMouseDown={() => selectItem(it.id)}
                    onDblClick={() => handleTextDoubleClick(it)}
                    onDragEnd={(e) =>
                      handleItemDragEnd(it.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                      })
                    }
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const scaleY = node.scaleY();

                      node.scaleX(1);
                      node.scaleY(1);

                      handleItemDragEnd(it.id, {
                        x: node.x(),
                        y: node.y(),
                        fontSize: Math.max(8, (it.fontSize ?? 24) * scaleY),
                      });
                    }}
                  />
                );
              }
              if (it.type === "image") {
                return (
                  <CanvasImage
                    id={it.id}
                    key={it.id}
                    it={it}
                    isSelected={it.id === selectedId}
                    tool={tool}
                    onSelect={() => selectItem(it.id)}
                    onDragEnd={handleItemDragEnd}
                    onResize={handleItemDragEnd}
                    nodeRef={(node) => (nodeRefs.current[it.id] = node)}
                  />
                );
              }

              return null;
            })}
          </Layer>
        </Stage>
        </div>
      </div>
    </div>
  );
}
