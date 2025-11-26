// SECTION 1 – Imports and setup
import React, { useRef, useEffect } from "react";


// SECTION 2 – Component definition
export default function InfiniteCanvas({onZoomChange}) {
  const canvasRef = useRef(null); // Reference to the canvas DOM element

  // SECTION 3 – useEffect lifecycle hook
  useEffect(() => {
    const canvas = canvasRef.current;          // Get canvas element
    const context = canvas.getContext("2d");   // Get 2D drawing context

    // SECTION 4 – State variables stored in closure
    let drawings = []; // Array storing all drawn line segments

    // potentially add shapes, text , and other memory elements - tim

    let cursorX, cursorY, prevCursorX, prevCursorY; // Track cursor movement
    let offsetX = 0;   // Horizontal panning offset
    let offsetY = 0;   // Vertical panning offset
    let scale = 1;     // Zoom level

    // SECTION 5 – Grid settings
    const DOT_SPACING = 50; // Distance between grid dots
    const DOT_SIZE = 2;     // Dot radius
    const DOT_COLOR = "#ccc"; // Dot color

    // SECTION 6 – Disable right-click menu
    document.oncontextmenu = () => false;

    // SECTION 7 – Resize canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;  // Match window width
      canvas.height = window.innerHeight; // Match window height
      redrawCanvas(); // Redraw after resize
    };

    // SECTION 8 – Coordinate conversion helpers
    const toScreenX = (xTrue) => (xTrue + offsetX) * scale; // Convert world → screen X
    const toScreenY = (yTrue) => (yTrue + offsetY) * scale; // Convert world → screen Y
    const toTrueX = (xScreen) => xScreen / scale - offsetX; // Convert screen → world X
    const toTrueY = (yScreen) => yScreen / scale - offsetY; // Convert screen → world Y
    const trueWidth = () => canvas.clientWidth / scale;     // True canvas width at current zoom
    const trueHeight = () => canvas.clientHeight / scale;   // True canvas height at current zoom
    // SECTION 9 – Draw background grid of dots
const drawDotGrid = () => {

  const dynamicSpacing = DOT_SPACING * scale;  // scale spacing
  const dynamicSize = DOT_SIZE * scale * 0.7;  // scale size

  const startX = Math.floor(toTrueX(0) / dynamicSpacing) * dynamicSpacing;
  const startY = Math.floor(toTrueY(0) / dynamicSpacing) * dynamicSpacing;
  const endX = toTrueX(canvas.width);
  const endY = toTrueY(canvas.height);

  context.fillStyle = DOT_COLOR;

  for (let x = startX; x < endX; x += dynamicSpacing) {
    for (let y = startY; y < endY; y += dynamicSpacing) {
      const screenX = toScreenX(x);
      const screenY = toScreenY(y);
      context.beginPath();
      context.arc(screenX, screenY, dynamicSize, 0, Math.PI * 2);
      context.fill();
    }
  }
};

// --- Redraw Grid When Zoom Changes by 50% ---
let lastRedrawZoom = scale;

// Track last zoom level that triggered a log
let lastLoggedScale = scale;



  if (Math.abs(scale - lastRedrawZoom) >= lastRedrawZoom * 0.5) {
    drawDotGrid();
    console.log("dot grid drawn");
  }




    // SECTION 10 – Draw a single line on the canvas
    const drawLine = (x0, y0, x1, y1) => {
      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.strokeStyle = "#000";
      context.lineWidth = 2;
      context.stroke();
    };

    // SECTION 11 – Full redraw of canvas
    const redrawCanvas = () => {
      context.fillStyle = "#fff";             // Set background color
      context.fillRect(0, 0, canvas.width, canvas.height); // Clear
      drawDotGrid();                           // Draw dot grid

      // Draw all previously saved line segments
      for (let line of drawings) {
        drawLine(
          toScreenX(line.x0),
          toScreenY(line.y0),
          toScreenX(line.x1),
          toScreenY(line.y1)
        );
      }
      console.log("canvasredrawn")
    };

    // SECTION 12 – Mouse input handling
    let leftMouseDown = false;
    let rightMouseDown = false;

    const onMouseDown = (e) => {
      if (e.button === 0) leftMouseDown = true;    // Left = draw
      else if (e.button === 2) rightMouseDown = true; // Right = pan
      cursorX = prevCursorX = e.pageX;              // Save cursor position
      cursorY = prevCursorY = e.pageY;
    };

    const onMouseMove = (e) => {
      cursorX = e.pageX;
      cursorY = e.pageY;

      const scaledX = toTrueX(cursorX);     // True world X
      const scaledY = toTrueY(cursorY);     // True world Y
      const prevScaledX = toTrueX(prevCursorX);
      const prevScaledY = toTrueY(prevCursorY);

      if (leftMouseDown) {
        // Save the line segment in world coordinates
        drawings.push({ x0: prevScaledX, y0: prevScaledY, x1: scaledX, y1: scaledY });
        drawLine(prevCursorX, prevCursorY, cursorX, cursorY); // Draw live line
      }

      if (rightMouseDown) {
        offsetX += (cursorX - prevCursorX) / scale; // Pan based on mouse movement
        offsetY += (cursorY - prevCursorY) / scale;
        redrawCanvas();
      }

      prevCursorX = cursorX;
      prevCursorY = cursorY;
    };

    const onMouseUp = () => {
      leftMouseDown = false;
      rightMouseDown = false;
    };

    // SECTION 13 – Zooming
    const onMouseWheel = (e) => {
      const scaleAmount = -e.deltaY / 500; // Zoom sensitivity
      scale *= 1 + scaleAmount;            // Apply zoom
      if (onZoomChange) {
      onZoomChange(scale);
      }
      // Check if zoom changed by ±50%
    if (Math.abs(scale - lastLoggedScale) >= lastLoggedScale * 0.1) {
      console.log("Zoom changed 50% — new scale:", scale);
      redrawCanvas();
      lastLoggedScale = scale; // Update reference point
    }


      // Keep zoom centered around cursor
      const distX = e.pageX / canvas.clientWidth;
      const distY = e.pageY / canvas.clientHeight;
      const unitsZoomedX = trueWidth() * scaleAmount;
      const unitsZoomedY = trueHeight() * scaleAmount;

      offsetX -= unitsZoomedX * distX;
      offsetY -= unitsZoomedY * distY;

      redrawCanvas();
    };

    // SECTION 14 – Touch input handling (single finger draw, two finger zoom/pan)
    const prevTouches = [null, null];
    let singleTouch = false;
    let doubleTouch = false;

    const onTouchStart = (e) => {
      if (e.touches.length === 1) singleTouch = true;
      else if (e.touches.length >= 2) doubleTouch = true;

      prevTouches[0] = e.touches[0];
      prevTouches[1] = e.touches[1];
    };

    const onTouchMove = (e) => {
      const t0 = e.touches[0];
      const prevT0 = prevTouches[0];

      const scaledX = toTrueX(t0.pageX);
      const scaledY = toTrueY(t0.pageY);
      const prevScaledX = toTrueX(prevT0.pageX);
      const prevScaledY = toTrueY(prevT0.pageY);

      if (singleTouch) {
        drawings.push({ x0: prevScaledX, y0: prevScaledY, x1: scaledX, y1: scaledY });
        drawLine(prevT0.pageX, prevT0.pageY, t0.pageX, t0.pageY);
      }

      if (doubleTouch) {
        const t1 = e.touches[1];
        const prevT1 = prevTouches[1];

        // Midpoint between two fingers
        const midX = (t0.pageX + t1.pageX) / 2;
        const midY = (t0.pageY + t1.pageY) / 2;
        const prevMidX = (prevT0.pageX + prevT1.pageX) / 2;
        const prevMidY = (prevT0.pageY + prevT1.pageY) / 2;

        // Zoom based on pinch distance
        const dist = Math.hypot(t0.pageX - t1.pageX, t0.pageY - t1.pageY);
        const prevDist = Math.hypot(prevT0.pageX - prevT1.pageX, prevT0.pageY - prevT1.pageY);
        const zoomAmount = dist / prevDist;
        scale *= zoomAmount;
        if (Math.abs(scale - lastLoggedScale) >= lastLoggedScale * 0.1) {
        console.log("Zoom changed 50% (touch) — new scale:", scale, "pinch");
        redrawCanvas();
        lastLoggedScale = scale;
        }

        // Pan relative to midpoint movement
        const panX = (midX - prevMidX) / scale;
        const panY = (midY - prevMidY) / scale;
        offsetX += panX;
        offsetY += panY;

        redrawCanvas();
      }

      prevTouches[0] = e.touches[0];
      prevTouches[1] = e.touches[1];
    };

    const onTouchEnd = () => {
      singleTouch = false;
      doubleTouch = false;
    };

    // SECTION 15 – Register event listeners
    window.addEventListener("resize", resizeCanvas);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseout", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onMouseWheel);
    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);
    canvas.addEventListener("touchmove", onTouchMove);

    // Initialize size
    resizeCanvas();

    // SECTION 16 – Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseout", onMouseUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("wheel", onMouseWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
      canvas.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  // SECTION 17 – Render canvas
  return (
    <canvas
      ref={canvasRef}
      id="infiniteCanvas"
      style={{
        width: window.innerWidth,
        height: window.innerHeight,
        display: "block",
        touchAction: "none",
        userSelect: "none",
      }}
    />
  );

  
}
