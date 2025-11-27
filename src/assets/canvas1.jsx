import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import getStroke from "perfect-freehand";
import Tools from "./toolbox/toolbar.jsx";
import SizeBadge from "./toolbox/UIElements.jsx";

// --------- helpers to build elements ---------
const createElement = (id, x1, y1, x2, y2, type) => {
  switch (type) {
    case "line":
    case "rectangle":
      // Just store coordinates – plain canvas will draw them
      return { id, x1, y1, x2, y2, type };

    case "pencil":
      return { id, type, points: [{ x: x1, y: y1 }] };

    case "text":
      // x2/y2 will be updated once we know text width/height
      return { id, type, x1, y1, x2, y2, text: "" };

    default:
      throw new Error(`Type not recognised: ${type}`);
  }
};

const nearPoint = (x, y, x1, y1, name) =>
  Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;

const distance = (a, b) =>
  Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const onLine = (x1, y1, x2, y2, x, y, maxDistance = 1) => {
  const a = { x: x1, y: y1 };
  const b = { x: x2, y: y2 };
  const c = { x, y };
  const offset = distance(a, b) - (distance(a, c) + distance(b, c));
  return Math.abs(offset) < maxDistance ? "inside" : null;
};

const positionWithinElement = (x, y, element) => {
  const { type, x1, x2, y1, y2 } = element;
  switch (type) {
    case "line": {
      const on = onLine(x1, y1, x2, y2, x, y);
      const start = nearPoint(x, y, x1, y1, "start");
      const end = nearPoint(x, y, x2, y2, "end");
      return start || end || on;
    }
    case "rectangle": {
      const topLeft = nearPoint(x, y, x1, y1, "tl");
      const topRight = nearPoint(x, y, x2, y1, "tr");
      const bottomLeft = nearPoint(x, y, x1, y2, "bl");
      const bottomRight = nearPoint(x, y, x2, y2, "br");
      const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
      return topLeft || topRight || bottomLeft || bottomRight || inside;
    }
    case "pencil": {
      const betweenAnyPoint = element.points.some((point, index) => {
        const nextPoint = element.points[index + 1];
        if (!nextPoint) return false;
        return (
          onLine(point.x, point.y, nextPoint.x, nextPoint.y, x, y, 5) != null
        );
      });
      return betweenAnyPoint ? "inside" : null;
    }
    case "text":
      return x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
    default:
      throw new Error(`Type not recognised: ${type}`);
  }
};

const getElementAtPosition = (x, y, elements) =>
  elements
    .map((element) => ({
      ...element,
      position: positionWithinElement(x, y, element),
    }))
    .find((element) => element.position !== null);

const adjustElementCoordinates = (element) => {
  const { type, x1, y1, x2, y2 } = element;
  if (type === "rectangle") {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return { x1: minX, y1: minY, x2: maxX, y2: maxY };
  } else {
    if (x1 < x2 || (x1 === x2 && y1 < y2)) {
      return { x1, y1, x2, y2 };
    } else {
      return { x1: x2, y1: y2, x2: x1, y2: y1 };
    }
  }
};

const cursorForPosition = (position) => {
  switch (position) {
    case "tl":
    case "br":
    case "start":
    case "end":
      return "nwse-resize";
    case "tr":
    case "bl":
      return "nesw-resize";
    default:
      return "move";
  }
};

const resizedCoordinates = (clientX, clientY, position, coordinates) => {
  const { x1, y1, x2, y2 } = coordinates;
  switch (position) {
    case "tl":
    case "start":
      return { x1: clientX, y1: clientY, x2, y2 };
    case "tr":
      return { x1, y1: clientY, x2: clientX, y2 };
    case "bl":
      return { x1: clientX, y1, x2, y2: clientY };
    case "br":
    case "end":
      return { x1, y1, x2: clientX, y2: clientY };
    default:
      return null;
  }
};

// --------- history hook ---------
const useHistory = (initialState) => {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([initialState]);

  const setState = (action, overwrite = false) => {
    const newState =
      typeof action === "function" ? action(history[index]) : action;
    if (overwrite) {
      const historyCopy = [...history];
      historyCopy[index] = newState;
      setHistory(historyCopy);
    } else {
      const updatedState = [...history].slice(0, index + 1);
      setHistory([...updatedState, newState]);
      setIndex((prev) => prev + 1);
    }
  };

  const undo = () => index > 0 && setIndex((prev) => prev - 1);
  const redo = () => index < history.length - 1 && setIndex((prev) => prev + 1);

  return [history[index], setState, undo, redo];
};

// --------- freehand helpers ---------
const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
};

// --------- draw elements with NORMAL canvas API ---------
const drawElement = (context, element) => {
  context.lineWidth = 2;
  context.strokeStyle = "black";
  context.fillStyle = "black";

  switch (element.type) {
    case "line": {
      context.beginPath();
      context.moveTo(element.x1, element.y1);
      context.lineTo(element.x2, element.y2);
      context.stroke();
      break;
    }
    case "rectangle": {
      const width = element.x2 - element.x1;
      const height = element.y2 - element.y1;
      context.beginPath();
      context.rect(element.x1, element.y1, width, height);
      context.stroke();
      break;
    }
    case "pencil": {
      const stroke = getSvgPathFromStroke(getStroke(element.points));
      const path = new Path2D(stroke);
      context.fill(path);
      break;
    }
    case "text": {
      context.textBaseline = "top";
      context.font = "24px sans-serif";
      context.fillText(element.text, element.x1, element.y1);
      break;
    }
    default:
      throw new Error(`Type not recognised: ${element.type}`);
  }
};

const adjustmentRequired = (type) => ["line", "rectangle"].includes(type);

// --------- pressed keys hook ---------
const usePressedKeys = () => {
  const [pressedKeys, setPressedKeys] = useState(new Set());

  useEffect(() => {
    const handleKeyDown = (event) => {
      setPressedKeys((prevKeys) => new Set(prevKeys).add(event.key));
    };

    const handleKeyUp = (event) => {
      setPressedKeys((prevKeys) => {
        const updated = new Set(prevKeys);
        updated.delete(event.key);
        return updated;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return pressedKeys;
};

// --------- main component ---------
const App = () => {
  const [elements, setElements, undo, redo] = useHistory([]);
  const [action, setAction] = useState("none"); // none | drawing | moving | resizing | writing | panning
  const [tool, setTool] = useState("selection");
  const [selectedElement, setSelectedElement] = useState(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [startPanMousePosition, setStartPanMousePosition] = useState({
    x: 0,
    y: 0,
  });
  const textAreaRef = useRef();
  const pressedKeys = usePressedKeys();

  // RENDER LOOP
  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    if (!canvas) return;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.translate(panOffset.x, panOffset.y);
    context.scale(scale, scale);

    elements.forEach((element) => {
      if (action === "text" && selectedElement?.id === element.id) return;
      drawElement(context, element);
    });

    context.restore();
  }, [elements, action, selectedElement, panOffset]);

  // undo / redo keyboard
  useEffect(() => {
    const undoRedoFunction = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        if (event.shiftKey) redo();
        else undo();
      }
    };

    document.addEventListener("keydown", undoRedoFunction);
    return () => document.removeEventListener("keydown", undoRedoFunction);
  }, [undo, redo]);

  //   // pan with wheel
  //   useEffect(() => {
  //     const panFunction = (event) => {
  //       setPanOffset((prev) => ({
  //         x: prev.x - event.deltaX,
  //         y: prev.y - event.deltaY,
  //       }));
  //     };

  //     document.addEventListener("wheel", panFunction);
  //     return () => document.removeEventListener("wheel", panFunction);
  //   }, []);

  // focus textarea when writing starts
  useEffect(() => {
    if (action !== "writing") return;
    if (!selectedElement) return;

    const textArea = textAreaRef.current;
    if (!textArea) return;

    textArea.focus();
    textArea.value = selectedElement.text || "";
  }, [action, selectedElement]);

  const updateElement = (id, x1, y1, x2, y2, type, options = {}) => {
    const elementsCopy = [...elements];

    switch (type) {
      case "line":
      case "rectangle":
        elementsCopy[id] = createElement(id, x1, y1, x2, y2, type);
        break;

      case "pencil":
        elementsCopy[id].points = [
          ...elementsCopy[id].points,
          { x: x2, y: y2 },
        ];
        break;

      case "text": {
        const canvas = document.getElementById("canvas");
        const ctx = canvas?.getContext("2d");
        if (ctx) {
          ctx.font = "24px 'Kalam', cursive";
          const text = options.text ?? elementsCopy[elIndex].text ?? "";
          const textWidth = ctx.measureText(text).width;
          const textHeight = 24; // approximate height for font

          elementsCopy[elIndex] = {
            ...elementsCopy[elIndex],
            x1,
            y1,
            x2: x1 + textWidth,
            y2: y1 + textHeight,
            text,
          };
        }
        break;
      }
      default:
        throw new Error(`Type not recognised: ${type}`);
    }

    setElements(elementsCopy, true);
  };

  const getMouseCoordinates = (event) => {
    const clientX = event.clientX - panOffset.x;
    const clientY = event.clientY - panOffset.y;
    return { clientX, clientY };
  };

  const handleMouseDown = (event) => {
    if (action === "writing") return;

    const { clientX, clientY } = getMouseCoordinates(event);

    // middle mouse / space + drag = pan
    if (event.button === 2 || pressedKeys.has(" ") || event.shiftKey) {
      setAction("panning");
      setStartPanMousePosition({ x: clientX, y: clientY });
      return;
    }

    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        if (element.type === "pencil") {
          const xOffsets = element.points.map((p) => clientX - p.x);
          const yOffsets = element.points.map((p) => clientY - p.y);
          setSelectedElement({ ...element, xOffsets, yOffsets });
        } else {
          const offsetX = clientX - element.x1;
          const offsetY = clientY - element.y1;
          setSelectedElement({ ...element, offsetX, offsetY });
        }
        setElements((prev) => prev); // trigger re-render

        if (element.position === "inside") setAction("moving");
        else setAction("resizing");
      }
    } else {
      const id = elements.length;
      const element = createElement(
        id,
        clientX,
        clientY,
        clientX,
        clientY,
        tool
      );
      setElements((prev) => [...prev, element]);
      setSelectedElement(element);
      setAction(tool === "text" ? "writing" : "drawing");
    }
  };

  const handleMouseMove = (event) => {
    const { clientX, clientY } = getMouseCoordinates(event);

    if (action === "panning") {
      const deltaX = clientX - startPanMousePosition.x;
      const deltaY = clientY - startPanMousePosition.y;

      setPanOffset({
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY,
      });
      return;
    }

    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      event.target.style.cursor = element
        ? cursorForPosition(element.position)
        : "default";
    }

    if (action === "drawing") {
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];
      updateElement(index, x1, y1, clientX, clientY, tool);
    } else if (action === "moving" && selectedElement) {
      if (selectedElement.type === "pencil") {
        const newPoints = selectedElement.points.map((_, idx) => ({
          x: clientX - selectedElement.xOffsets[idx],
          y: clientY - selectedElement.yOffsets[idx],
        }));
        const elementsCopy = [...elements];
        elementsCopy[selectedElement.id] = {
          ...elementsCopy[selectedElement.id],
          points: newPoints,
        };
        setElements(elementsCopy, true);
      } else {
        const { id, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement;
        const width = x2 - x1;
        const height = y2 - y1;
        const newX1 = clientX - offsetX;
        const newY1 = clientY - offsetY;
        const options =
          type === "text" ? { text: selectedElement.text || "" } : {};
        updateElement(
          id,
          newX1,
          newY1,
          newX1 + width,
          newY1 + height,
          type,
          options
        );
      }
    } else if (action === "resizing" && selectedElement) {
      const { id, type, position, ...coords } = selectedElement;
      const { x1, y1, x2, y2 } = resizedCoordinates(
        clientX,
        clientY,
        position,
        coords
      );
      updateElement(id, x1, y1, x2, y2, type);
    }
  };

  const handleMouseUp = () => {
    if (selectedElement) {
      if (selectedElement.type === "text" && action === "drawing") {
        setAction("writing");
        return;
      }

      const index = elements.findIndex((e) => e.id === selectedElement.id);
      if (index !== -1) {
        const element = elements[index];
        if (
          (action === "drawing" || action === "resizing") &&
          adjustmentRequired(element.type)
        ) {
          const { x1, y1, x2, y2 } = adjustElementCoordinates(element);
          updateElement(element.id, x1, y1, x2, y2, element.type);
        }
      }
    }

    if (action === "writing") return;

    setAction("none");
    setSelectedElement(null);
  };

  // const handleMouseDown = (event) => {
  //   if (action === "writing") return;

  //   const { clientX: rawX, clientY: rawY } = getRawMouseCoordinates(event);
  //   const { clientX, clientY } = getMouseCoordinates(event);

  const handleBlur = (event) => {
    if (!selectedElement) return;

    const text = event.target.value;
    const { id, x1, y1, type } = selectedElement;

    // Update text element with real size and content
    const canvas = document.getElementById("canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.font = "24px sans-serif";
      const width = ctx.measureText(text).width;
      const height = 24;

      updateElement(id, x1, y1, x1 + width, y1 + height, type, { text });
    }

    setAction("none");
    setSelectedElement(null);
  };

  useEffect(() => {
    const handleWheel = (event) => {
      event.preventDefault();

      const zoomIntensity = 0.0005; // speed of zoom
      const delta = event.deltaY;

      // get mouse position relative to canvas
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      // compute zoom
      const newScale = scale - delta * zoomIntensity;

      // clamp scale (optional)
      const clampedScale = Math.min(Math.max(newScale, 0.2), 4);

      // adjust pan so zoom stays centered under mouse
      const scaleFactor = clampedScale / scale;

      setPanOffset((prev) => ({
        x: mouseX - (mouseX - prev.x) * scaleFactor,
        y: mouseY - (mouseY - prev.y) * scaleFactor,
      }));

      setScale(clampedScale);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [scale]);

  return (
    <div>
      <Tools tool={tool} setTool={setTool} />
      <SizeBadge scale={scale} setScale={setScale} />

      {/* Undo / redo */}
      <div style={{ position: "fixed", zIndex: 2, bottom: 0, padding: 10 }}>
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
      </div>

      {/* Text Editor Overlay */}
       {action === "writing" && selectedElement ? (
        <textarea
          ref={textAreaRef}
          onBlur={handleBlur}
          className="fixed m-0 p-0 border-0 outline-none resize-none overflow-hidden bg-transparent whitespace-pre text-slate-800"
          style={{
            top: (selectedElement.y1 * scale) + panOffset.y,
            left: (selectedElement.x1 * scale) + panOffset.x,
            font: `normal ${24 * scale}px 'helvetica', cursive`,
            color: "#1e293b",
            lineHeight: 1,
            // Calculate width based on text or default
            width: (selectedElement.x2 - selectedElement.x1) * scale + 50 + "px",
            height: (selectedElement.y2 - selectedElement.y1) * scale + 50 + "px",
            zIndex: 100,
          }}
        />
      ) : null}

      <canvas
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          position: "absolute",
          zIndex: 1,
        }}
      ></canvas>

      {/* Dot Grid Overlay */}
      <div
        className="dot-grid"
        style={{
          backgroundImage:
            "radial-gradient(circle, #a1a1a1ff 1px, transparent 1px)",
          // scale the grid spacing with the canvas scale so it stays consistent
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          position: "absolute",
          top: -5000,
          left: -5000,
          width: 10000,
          height: 10000,
          pointerEvents: "none",
          zIndex: 0,
          transformOrigin: "0 0",
          // Always move & scale the grid to match the canvas pan/zoom
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
        }}
      ></div>
    </div>
  );
};

export default App;
