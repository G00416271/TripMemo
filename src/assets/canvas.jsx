import React, { useRef, useEffect } from "react";

export default function InfiniteCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    let drawings = [];
    let cursorX, cursorY, prevCursorX, prevCursorY;
    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;

    const DOT_SPACING = 50;
    const DOT_SIZE = 2;
    const DOT_COLOR = "#ccc";

    // Disable context menu
    document.oncontextmenu = () => false;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redrawCanvas();
    };

    // Coordinate conversion helpers
    const toScreenX = (xTrue) => (xTrue + offsetX) * scale;
    const toScreenY = (yTrue) => (yTrue + offsetY) * scale;
    const toTrueX = (xScreen) => xScreen / scale - offsetX;
    const toTrueY = (yScreen) => yScreen / scale - offsetY;
    const trueWidth = () => canvas.clientWidth / scale;
    const trueHeight = () => canvas.clientHeight / scale;

    // Draw dot grid
    const drawDotGrid = () => {
      const startX = Math.floor(toTrueX(0) / DOT_SPACING) * DOT_SPACING;
      const startY = Math.floor(toTrueY(0) / DOT_SPACING) * DOT_SPACING;
      const endX = toTrueX(canvas.width);
      const endY = toTrueY(canvas.height);

      context.fillStyle = DOT_COLOR;

      for (let x = startX; x < endX; x += DOT_SPACING) {
        for (let y = startY; y < endY; y += DOT_SPACING) {
          const screenX = toScreenX(x);
          const screenY = toScreenY(y);
          context.beginPath();
          context.arc(screenX, screenY, DOT_SIZE, 0, Math.PI * 2);
          context.fill();
        }
      }
    };

    const drawLine = (x0, y0, x1, y1) => {
      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.strokeStyle = "#000";
      context.lineWidth = 2;
      context.stroke();
    };

    const redrawCanvas = () => {
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      drawDotGrid();

      for (let line of drawings) {
        drawLine(
          toScreenX(line.x0),
          toScreenY(line.y0),
          toScreenX(line.x1),
          toScreenY(line.y1)
        );
      }
    };

    // Input handling
    let leftMouseDown = false;
    let rightMouseDown = false;

    const onMouseDown = (e) => {
      if (e.button === 0) {
        leftMouseDown = true;
        rightMouseDown = false;
      } else if (e.button === 2) {
        rightMouseDown = true;
        leftMouseDown = false;
      }
      cursorX = prevCursorX = e.pageX;
      cursorY = prevCursorY = e.pageY;
    };

    const onMouseMove = (e) => {
      cursorX = e.pageX;
      cursorY = e.pageY;
      const scaledX = toTrueX(cursorX);
      const scaledY = toTrueY(cursorY);
      const prevScaledX = toTrueX(prevCursorX);
      const prevScaledY = toTrueY(prevCursorY);

      if (leftMouseDown) {
        drawings.push({ x0: prevScaledX, y0: prevScaledY, x1: scaledX, y1: scaledY });
        drawLine(prevCursorX, prevCursorY, cursorX, cursorY);
      }
      if (rightMouseDown) {
        offsetX += (cursorX - prevCursorX) / scale;
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

    const onMouseWheel = (e) => {
      const scaleAmount = -e.deltaY / 500;
      scale *= 1 + scaleAmount;

      const distX = e.pageX / canvas.clientWidth;
      const distY = e.pageY / canvas.clientHeight;
      const unitsZoomedX = trueWidth() * scaleAmount;
      const unitsZoomedY = trueHeight() * scaleAmount;

      offsetX -= unitsZoomedX * distX;
      offsetY -= unitsZoomedY * distY;
      redrawCanvas();
    };

    // Touch input
    const prevTouches = [null, null];
    let singleTouch = false;
    let doubleTouch = false;

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        singleTouch = true;
        doubleTouch = false;
      } else if (e.touches.length >= 2) {
        singleTouch = false;
        doubleTouch = true;
      }
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

        const midX = (t0.pageX + t1.pageX) / 2;
        const midY = (t0.pageY + t1.pageY) / 2;
        const prevMidX = (prevT0.pageX + prevT1.pageX) / 2;
        const prevMidY = (prevT0.pageY + prevT1.pageY) / 2;

        const dist = Math.hypot(t0.pageX - t1.pageX, t0.pageY - t1.pageY);
        const prevDist = Math.hypot(prevT0.pageX - prevT1.pageX, prevT0.pageY - prevT1.pageY);
        const zoomAmount = dist / prevDist;
        scale *= zoomAmount;

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

    // Register listeners
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

    resizeCanvas();

    return () => {
      // Clean up
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

  return (
    <canvas
      ref={canvasRef}
      id="infiniteCanvas"
      style={{
        width: "100vw",
        height: "100vh",
        display: "block",
        touchAction: "none",
        userSelect: "none",
      }}
    />
  );
}
