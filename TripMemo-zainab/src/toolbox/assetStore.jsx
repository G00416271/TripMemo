import { useState, useEffect, useMemo  } from "react";
import ImagePreview from "./imagePreview";

export default function BottomDrawer({ serverData }) {
  const [tab, setTab] = useState("assets");
  const [assets, setAssets] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const [drawerHeight, setDrawerHeight] = useState(60);
  const [dragging, setDragging] = useState(false);

  const PIXABAY_API_KEY = "53481167-b261e4a8fd5c85523c6b9b422";
const tags = useMemo(() => {
  if (!serverData) return [];

  // backend returns ["a","b"]
  if (Array.isArray(serverData)) return serverData;

  // backend returns { clipAnalysis: ["a","b"] }
  if (Array.isArray(serverData.clipAnalysis)) return serverData.clipAnalysis;

  return (
    serverData.tags ||
    serverData.inputTags ||
    serverData.matchedUserInterests?.inputTags ||
    []
  );
}, [serverData]);

  // --- drag logic ---
  const startDrag = () => setDragging(true);
  const stopDrag = () => setDragging(false);

  const onDrag = (e) => {
    if (!dragging) return;
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight > 60 && newHeight < window.innerHeight - 50) {
      setDrawerHeight(newHeight);
    }
  };

  useEffect(() => {
    const move = (e) => onDrag(e);
    const up = () => stopDrag();

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging]); // ✅ don’t re-add listeners every render

  // --- fetch images ---
  useEffect(() => {
    if (!PIXABAY_API_KEY || tags.length === 0) return;

    const fetchImages = async () => {
      try {
        const requests = tags.map((tag) =>
          fetch(
            `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
              tag
            )}&image_type=photo&per_page=15&safesearch=true`
          ).then((r) => r.json())
        );

        const results = await Promise.all(requests);
        setAssets(results.flatMap((r) => r?.hits || []));
      } catch (err) {
        console.error("Pixabay fetch failed:", err);
        setAssets([]);
      }
    };

    fetchImages();
  }, [tags, PIXABAY_API_KEY]);


  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#ffffff",
          color: "#222",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          height: drawerHeight,
          transition: dragging ? "none" : "0.2s",
          overflow: "hidden",
          zIndex: 9999,
          boxShadow: "0 -3px 20px rgba(0,0,0,0.1)",
        }}
      >
        {/* handle */}
        <div
          style={{
            padding: 12,
            textAlign: "center",
            cursor: "ns-resize",
            background: "rgba(26, 1, 255, 0.5)",
            userSelect: "none",
            color: "#fff",
            fontWeight: "600",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            letterSpacing: 1,
          }}
          onMouseDown={startDrag}
        >
          ⬆
        </div>

        {/* tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "3px solid rgba(26, 1, 255, 0.5)",
          }}
        >
          <button
            onClick={() => setTab("assets")}
            style={{
              flex: 1,
              padding: 10,
              background: tab === "assets" ? "rgba(26, 1, 255, 0.15)" : "transparent",
              color: "#222",
              border: "none",
              fontWeight: "600",
            }}
          >
            Assets
          </button>

          <button
            onClick={() => setTab("widgets")}
            style={{
              flex: 1,
              padding: 10,
              background: tab === "widgets" ? "rgba(26, 1, 255, 0.15)" : "transparent",
              color: "#222",
              border: "none",
              fontWeight: "600",
            }}
          >
            Widgets
          </button>
        </div>

        {/* grid */}
        {tab === "assets" && (
          <div
            style={{
              padding: 10,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
              overflowY: "auto",
              height: "calc(100% - 95px)",
              background: "#7b7bffff",
            }}
          >
            {assets.length === 0 && <p style={{ color: "#666" }}>loading…</p>}

            {assets.map((img) => (
              <img
                key={img.id}
                src={img.webformatURL}
                loading="lazy"
                onClick={() => setSelectedImage(img)}
                style={{
                  width: 270,
                  height: 210,
                  borderRadius: 8,
                  objectFit: "cover",
                  cursor: "pointer",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                  border: "3px solid rgba(26, 1, 255, 0.15)",
                  transition: "0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.border = "3px solid rgba(26, 1, 255, 0.5)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.border = "3px solid rgba(26, 1, 255, 0.15)")
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* popup */}
      <ImagePreview image={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
}