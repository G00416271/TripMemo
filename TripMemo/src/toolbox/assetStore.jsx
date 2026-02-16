import { useState, useEffect, useMemo } from "react";
import ImagePreview from "./imagePreview";

export default function BottomDrawer({ serverData, memoryTags = [] }) {
  const [tab, setTab] = useState("assets");
  const [assets, setAssets] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const [drawerHeight, setDrawerHeight] = useState(60);
  const [dragging, setDragging] = useState(false);

  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  const PIXABAY_API_KEY = "53481167-b261e4a8fd5c85523c6b9b422";

  const tags = useMemo(() => {
    // ✅ 1) use tags saved on this memory
    if (Array.isArray(memoryTags) && memoryTags.length > 0) return memoryTags;

    // ✅ 2) fallback to serverData (CLIP)
    if (!serverData) return [];

    if (Array.isArray(serverData.sub) && serverData.sub.length > 0) {
      return serverData.sub
        .map((s) => {
          if (typeof s !== "string") return null;
          const parts = s.split(":");
          const raw = parts[1] ?? parts[0];
          return raw.replace(/_/g, " ").trim();
        })
        .filter(Boolean);
    }

    if (Array.isArray(serverData.main) && serverData.main.length > 0) {
      return serverData.main;
    }

    return [];
  }, [memoryTags, serverData]);

  // keep query reasonable (Pixabay likes shorter queries)
  const query = useMemo(() => tags.slice(0, 5).join(" "), [tags]);

  // reset to page 1 when query changes
  useEffect(() => {
    setPage(1);
  }, [query]);

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
  }, [dragging]);

  // --- fetch images (paged) ---
  useEffect(() => {
    if (!PIXABAY_API_KEY || !query) return;

    const fetchImages = async () => {
      try {
        setAssets([]); // loading…

        const res = await fetch(
          `https://pixabay.com/api/?key=${PIXABAY_API_KEY}` +
            `&q=${encodeURIComponent(query)}` +
            `&image_type=photo&per_page=${PER_PAGE}` +
            `&page=${page}` +
            `&safesearch=true`,
        );

        const data = await res.json();
        setAssets(data?.hits || []);
      } catch (err) {
        console.error("Pixabay fetch failed:", err);
        setAssets([]);
      }
    };

    fetchImages();
  }, [query, page, PIXABAY_API_KEY]);

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
              background:
                tab === "assets" ? "rgba(26, 1, 255, 0.15)" : "transparent",
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
              background:
                tab === "widgets" ? "rgba(26, 1, 255, 0.15)" : "transparent",
              color: "#222",
              border: "none",
              fontWeight: "600",
            }}
          >
            Widgets
          </button>
        </div>

        {/* content */}
        {tab === "assets" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "calc(100% - 95px)",
              background: "#7b7bffff",
            }}
          >
            {/* pagination bar */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                alignItems: "center",
                padding: 10,
                background: "rgba(255,255,255,0.9)",
                borderBottom: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "6px 12px",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                }}
              >
                Prev
              </button>

              <div style={{ padding: "6px 12px", fontWeight: 600 }}>
                Page {page}
              </div>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={assets.length < PER_PAGE}
                style={{
                  padding: "6px 12px",
                  cursor: assets.length < PER_PAGE ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>

            {/* image grid */}
            <div
              style={{
                padding: 10,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                justifyContent: "center",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {assets.length === 0 && <p style={{ color: "red" }}>loading…</p>}

              {assets.map((img) => (
                <img
                  key={img.id}
                  src={img.webformatURL}
                  loading="lazy"
                  onClick={() => setSelectedImage(img)}
                  draggable
                  onDragStart={(e) => {
                    // pick whichever you prefer
                    const src = img.largeImageURL || img.webformatURL;

                    // put the URL in the drag payload
                    e.dataTransfer.setData("text/uri-list", src);
                    e.dataTransfer.setData("text/plain", src);

                    // optional: nicer cursor behavior
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  style={{
                    width: 270,
                    height: 210,
                    borderRadius: 8,
                    objectFit: "cover",
                    cursor: "grab",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                    border: "3px solid rgba(26, 1, 255, 0.15)",
                    transition: "0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.border =
                      "3px solid rgba(26, 1, 255, 0.5)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.border =
                      "3px solid rgba(26, 1, 255, 0.15)")
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* popup */}
      <ImagePreview
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
}
