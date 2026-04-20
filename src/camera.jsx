import { useRef, useEffect, useState, useCallback } from "react";

function Camera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [captures, setCaptures] = useState([]);
  const [flash, setFlash] = useState(false);
  const [stream, setStream] = useState(null);
  const maxZoom = 4;
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Swipe tracking refs
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent),
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile && !import.meta.env.DEV) return;
    let s;

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "environment", aspectRatio: { ideal: 9 / 16 } },
      })
      .then((mediaStream) => {
        s = mediaStream;
        setStream(mediaStream);
        const video = videoRef.current;
        if (!video) return;
        video.muted = true;
        video.srcObject = mediaStream;
        video.onloadedmetadata = () => video.play();
      })
      .catch((err) => console.error("Camera error:", err));

    return () => {
      if (s) s.getTracks().forEach((t) => t.stop());
    };
  }, [isMobile]);

  useEffect(() => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.();
    if (capabilities?.zoom) {
      const min = capabilities.zoom.min;
      const max = capabilities.zoom.max;
      const applied = min + (zoom - 1) * ((max - min) / (maxZoom - 1));
      track.applyConstraints({ advanced: [{ zoom: applied }] }).catch(() => {});
    }
  }, [zoom, stream]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    if (zoom > 1) {
      const scale = zoom;
      const sw = video.videoWidth / scale;
      const sh = video.videoHeight / scale;
      const sx = (video.videoWidth - sw) / 2;
      const sy = (video.videoHeight - sh) / 2;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(video, 0, 0);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCaptures((prev) => [dataUrl, ...prev].slice(0, 6));
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  }, [zoom]);

  const showPrev = useCallback(() => {
    setSelectedIndex((i) => (i > 0 ? i - 1 : captures.length - 1));
  }, [captures.length]);

  const showNext = useCallback(() => {
    setSelectedIndex((i) => (i < captures.length - 1 ? i + 1 : 0));
  }, [captures.length]);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (touchStartX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      touchStartX.current = null;
      touchStartY.current = null;

      // Only handle horizontal swipes (ignore vertical scroll attempts)
      if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;

      if (dx < 0) {
        showNext();
      } else {
        showPrev();
      }
    },
    [showNext, showPrev],
  );

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "Escape") setSelectedIndex(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, showPrev, showNext]);

  const isDev = import.meta.env.DEV;

  if (!isMobile && !isDev) {
    return (
      <div style={styles.notMobile}>
        <p style={styles.notMobileText}>
          This feature is only available on mobile.
        </p>
      </div>
    );
  }

  const nativeZoomSupported = (() => {
    if (!stream) return false;
    const track = stream.getVideoTracks()[0];
    return !!track?.getCapabilities?.()?.zoom;
  })();

  return (
    <div style={styles.root}>
      {flash && <div style={styles.flash} />}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          ...styles.video,
          transform: nativeZoomSupported ? "none" : `scale(${zoom})`,
        }}
      />

      {showGrid && (
        <div style={styles.grid} aria-hidden>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.gridLine,
                ...(i < 2
                  ? {
                      left: `${(i + 1) * 33.33}%`,
                      top: 0,
                      width: 1,
                      height: "100%",
                    }
                  : {
                      top: `${(i - 1) * 33.33}%`,
                      left: 0,
                      height: 1,
                      width: "100%",
                    }),
              }}
            />
          ))}
        </div>
      )}

      <div style={styles.topBar}>
        <button
          style={styles.iconBtn}
          onClick={() => setShowGrid((g) => !g)}
          title="Toggle grid"
        >
          {showGrid ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="1" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="1" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          )}
        </button>
      </div>

      <div style={styles.zoomBar}>
        {[1, 2, 3, 4].map((z) => (
          <button
            key={z}
            style={{
              ...styles.zoomBtn,
              ...(zoom === z ? styles.zoomBtnActive : {}),
            }}
            onClick={() => setZoom(z)}
          >
            {z}×
          </button>
        ))}
      </div>

      <div style={styles.bottomBar}>
        <div style={styles.gallery}>
          {captures.map((img, i) => (
            <img
              key={i}
              src={img}
              style={styles.galleryImg}
              onClick={() => setSelectedIndex(i)}
            />
          ))}
        </div>

        <button style={styles.shutter} onClick={capture} aria-label="Capture photo">
          <div style={styles.shutterInner} />
        </button>

        <div style={{ width: 56 }} />
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {selectedIndex !== null && captures.length > 0 && (
        <div
          style={styles.previewOverlay}
          onClick={() => setSelectedIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Left arrow */}
          {captures.length > 1 && (
            <button
              style={{ ...styles.navBtn, left: 16 }}
              onClick={(e) => { e.stopPropagation(); showPrev(); }}
              aria-label="Previous photo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          <img
            src={captures[selectedIndex]}
            style={styles.previewImage}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Right arrow */}
          {captures.length > 1 && (
            <button
              style={{ ...styles.navBtn, right: 16 }}
              onClick={(e) => { e.stopPropagation(); showNext(); }}
              aria-label="Next photo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Dot indicators */}
          {captures.length > 1 && (
            <div style={styles.dots}>
              {captures.map((_, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.dot,
                    ...(i === selectedIndex ? styles.dotActive : {}),
                  }}
                />
              ))}
            </div>
          )}

          {/* Close hint */}
          <div style={styles.closeHint}>tap outside to close</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: {
    position: "relative",
    width: "100vw",
    height: "100dvh",
    background: "#000",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transformOrigin: "center center",
    transition: "transform 0.2s ease",
  },
  flash: {
    position: "absolute",
    inset: 0,
    background: "#fff",
    opacity: 0.85,
    zIndex: 50,
    pointerEvents: "none",
  },
  grid: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 10,
  },
  gridLine: {
    position: "absolute",
    background: "rgba(255,255,255,0.3)",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 100,
    zIndex: 20,
    display: "flex",
    justifyContent: "flex-end",
    padding: "16px 20px",
    background: "linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)",
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 8,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBar: {
    position: "absolute",
    bottom: 180,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 20,
    display: "flex",
    gap: 8,
    background: "rgba(0,0,0,0.4)",
    borderRadius: 24,
    padding: "6px 10px",
    backdropFilter: "blur(8px)",
  },
  zoomBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    padding: "4px 10px",
    borderRadius: 16,
    transition: "all 0.15s ease",
    letterSpacing: "0.02em",
  },
  zoomBtnActive: {
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
  },
  bottomBar: {
  position: "absolute",
  bottom: 0,                           
  left: 0,
  right: 0,
  zIndex: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 32px 84px 32px",     
  background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
},
  gallery: {
    display: "flex",
    gap: 6,
    maxWidth: 120,
    overflowX: "auto",
  },
  galleryImg: {
    width: 50,
    height: 50,
    objectFit: "cover",
    borderRadius: 6,
    cursor: "pointer",
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    border: "3px solid #fff",
    background: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    transition: "transform 0.1s ease",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: "#fff",
  },
  notMobile: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
  notMobileText: {
    fontSize: "1.2rem",
    color: "#888",
  },
  previewOverlay: {
    position: "absolute",
    inset: 0,
    background: "black",
    zIndex: 100,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    userSelect: "none",
    WebkitUserSelect: "none",
    draggable: false,
  },
  navBtn: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 110,
    background: "rgba(0,0,0,0.45)",
    border: "none",
    borderRadius: "50%",
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    backdropFilter: "blur(4px)",
  },
  dots: {
    position: "absolute",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.35)",
    transition: "background 0.2s ease",
  },
  dotActive: {
    background: "#fff",
  },
  closeHint: {
    position: "absolute",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    pointerEvents: "none",
    letterSpacing: "0.03em",
  },
};

export default Camera;