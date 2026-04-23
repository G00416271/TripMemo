import React, { useState, useEffect, useRef } from "react";
import CanvasThumbnail from "./CanvasThumbnail";
import { FiSearch, FiX, FiArrowLeft, FiCompass, FiEye } from "react-icons/fi";

export default function ExplorePage({ setActiveTab, onOpenMemory }) {
  const [memories, setMemories] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "name" | "creator"
  const [hoveredId, setHoveredId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch("https://tripmemo-11.onrender.com/memories/explore")
      .then((r) => r.json())
      .then((data) => {
        setMemories(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setFiltered(memories); return; }

    setFiltered(
      memories.filter((m) => {
        if (activeFilter === "name")
          return m.title?.toLowerCase().includes(q);
        if (activeFilter === "creator")
          return (
            m.username?.toLowerCase().includes(q) ||
            m.first_name?.toLowerCase().includes(q) ||
            m.last_name?.toLowerCase().includes(q)
          );
        // "all" — match either
        return (
          m.title?.toLowerCase().includes(q) ||
          m.username?.toLowerCase().includes(q) ||
          m.first_name?.toLowerCase().includes(q) ||
          m.last_name?.toLowerCase().includes(q)
        );
      })
    );
  }, [query, activeFilter, memories]);

  const handleCardClick = (memory) => {
    if (onOpenMemory) {
      onOpenMemory(memory);
    } else {
      window.open(`/share/${memory.memory_id}`, "_blank");
    }
  };

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div style={s.page}>
      {/* ── Animated background ── */}
      <div style={s.bgOrb1} />
      <div style={s.bgOrb2} />
      <div style={s.bgOrb3} />

      {/* ── Header ── */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => setActiveTab("home")}>
          <FiArrowLeft size={16} />
        </button>

        <div style={s.headerTitle}>
          <FiCompass size={18} style={{ color: "var(--accent)" }} />
          <span style={s.titleText}>Explore</span>
          {!loading && (
            <span style={s.countBadge}>{filtered.length}</span>
          )}
        </div>
      </div>

      {/* ── Search + filters ── */}
      <div style={s.searchWrap}>
        <div style={s.searchBar}>
          <FiSearch size={15} style={s.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scrapbooks…"
            style={s.searchInput}
          />
          {query && (
            <button style={s.clearBtn} onClick={clearSearch}>
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div style={s.filterRow}>
          {[
            { id: "all",     label: "All" },
            { id: "name",    label: "By name" },
            { id: "creator", label: "By creator" },
          ].map((f) => (
            <button
              key={f.id}
              style={{
                ...s.filterPill,
                ...(activeFilter === f.id ? s.filterPillActive : {}),
              }}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={s.content}>
        {loading ? (
          <div style={s.centeredMsg}>
            <div style={s.spinner} />
            <p style={s.msgText}>Discovering scrapbooks…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.centeredMsg}>
            <div style={s.emptyIcon}>🔭</div>
            <p style={s.msgTitle}>Nothing found</p>
            <p style={s.msgText}>
              {query ? `No scrapbooks match "${query}"` : "No public scrapbooks yet"}
            </p>
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map((memory, i) => (
              <div
                key={memory.memory_id}
                style={{
                  ...s.card,
                  animationDelay: `${i * 40}ms`,
                  ...(hoveredId === memory.memory_id ? s.cardHovered : {}),
                }}
                onClick={() => handleCardClick(memory)}
                onMouseEnter={() => setHoveredId(memory.memory_id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Thumbnail */}
                <div style={s.thumbWrap}>
                  <CanvasThumbnail
                    memoryId={memory.memory_id}
                    memoryTitle={memory.title}
                    width={320}
                    height={180}
                    showShareBtn={false}
                    showExportBtn={false}
                  />

                  {/* View overlay on hover */}
                  <div style={{
                    ...s.viewOverlay,
                    opacity: hoveredId === memory.memory_id ? 1 : 0,
                  }}>
                    <div style={s.viewPill}>
                      <FiEye size={13} />
                      View
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={s.cardFooter}>
                  <div style={s.cardMeta}>
                    <h3 style={s.cardTitle}>{memory.title}</h3>
                    <div style={s.creatorRow}>
                      <img
                        src={
                          memory.avatar_url ||
                          `https://api.dicebear.com/7.x/adventurer/svg?seed=${memory.user_id}`
                        }
                        alt={memory.username}
                        style={s.avatar}
                      />
                      <span style={s.creatorName}>
                        {memory.first_name} {memory.last_name}
                        <span style={s.username}> @{memory.username}</span>
                      </span>
                    </div>
                  </div>
                  <p style={s.cardDate}>
                    {new Date(memory.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes exploreCardIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(30px, -20px) scale(1.08); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-20px, 30px) scale(1.05); }
        }
        @keyframes exploreSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100%",
    background: "#f7f6f9",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
    paddingBottom: 100,
  },

  // Ambient orbs
  bgOrb1: {
    position: "fixed",
    top: -120,
    right: -80,
    width: 340,
    height: 340,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,0,85,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
    animation: "orbFloat1 8s ease-in-out infinite",
    zIndex: 0,
  },
  bgOrb2: {
    position: "fixed",
    bottom: 80,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,216,255,0.07) 0%, transparent 70%)",
    pointerEvents: "none",
    animation: "orbFloat2 10s ease-in-out infinite",
    zIndex: 0,
  },
  bgOrb3: {
    position: "fixed",
    top: "40%",
    left: "40%",
    width: 200,
    height: 200,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(178,75,243,0.05) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },

  // Header
  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 20px 12px",
    background: "rgba(247,246,249,0.88)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(26,22,37,0.06)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1.5px solid rgba(26,22,37,0.1)",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#555",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    flexShrink: 0,
    transition: "all 0.18s",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  titleText: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 22,
    fontWeight: 800,
    color: "#151515",
    letterSpacing: "-0.03em",
  },
  countBadge: {
    background: "rgba(255,0,85,0.1)",
    color: "#FF0055",
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 20,
    fontFamily: "'DM Sans', sans-serif",
  },

  // Search
  searchWrap: {
    padding: "14px 20px 10px",
    position: "sticky",
    top: 65,
    zIndex: 19,
    background: "rgba(247,246,249,0.88)",
    backdropFilter: "blur(12px)",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "white",
    border: "1.5px solid rgba(26,22,37,0.08)",
    borderRadius: 14,
    padding: "10px 14px",
    boxShadow: "0 2px 12px rgba(26,22,37,0.06)",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  searchIcon: {
    color: "#aaa",
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 14,
    color: "#151515",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 400,
  },
  clearBtn: {
    background: "rgba(26,22,37,0.07)",
    border: "none",
    borderRadius: 6,
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#666",
    flexShrink: 0,
  },
  filterRow: {
    display: "flex",
    gap: 8,
    marginTop: 10,
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  filterPill: {
    padding: "6px 14px",
    borderRadius: 20,
    border: "1.5px solid rgba(26,22,37,0.1)",
    background: "white",
    fontSize: 12,
    fontWeight: 600,
    color: "#777",
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.18s",
    whiteSpace: "nowrap",
  },
  filterPillActive: {
    background: "#151515",
    borderColor: "#151515",
    color: "white",
  },

  // Content
  content: {
    padding: "16px 16px 0",
    position: "relative",
    zIndex: 1,
  },

  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },

  // Cards
  card: {
    background: "white",
    borderRadius: 20,
    overflow: "hidden",
    border: "1.5px solid rgba(26,22,37,0.06)",
    boxShadow: "0 4px 16px rgba(26,22,37,0.07)",
    cursor: "pointer",
    position: "relative",
    animation: "exploreCardIn 0.4s cubic-bezier(0.4,0,0.2,1) both",
    transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s, border-color 0.22s",
  },
  cardHovered: {
    transform: "translateY(-5px) scale(1.01)",
    boxShadow: "0 16px 40px rgba(26,22,37,0.13)",
    borderColor: "rgba(255,0,85,0.2)",
  },
  thumbWrap: {
    position: "relative",
    width: "100%",
    lineHeight: 0,
    overflow: "hidden",
  },
  viewOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.2s",
    backdropFilter: "blur(2px)",
  },
  viewPill: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "white",
    color: "#151515",
    padding: "8px 18px",
    borderRadius: 30,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
  },
  cardFooter: {
    padding: "12px 16px 14px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: "#151515",
    margin: "0 0 6px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    letterSpacing: "-0.02em",
  },
  creatorRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "1.5px solid rgba(26,22,37,0.1)",
    flexShrink: 0,
    objectFit: "cover",
  },
  creatorName: {
    fontSize: 12,
    color: "#555",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  username: {
    color: "#aaa",
    fontWeight: 400,
  },
  cardDate: {
    fontSize: 11,
    color: "#bbb",
    fontWeight: 500,
    flexShrink: 0,
    marginTop: 2,
    whiteSpace: "nowrap",
  },

  // Empty / loading states
  centeredMsg: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    textAlign: "center",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid rgba(255,0,85,0.15)",
    borderTopColor: "#FF0055",
    borderRadius: "50%",
    animation: "exploreSpin 0.9s linear infinite",
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 14,
  },
  msgTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 18,
    fontWeight: 700,
    color: "#151515",
    margin: "0 0 6px",
  },
  msgText: {
    fontSize: 13,
    color: "#9a9a9a",
    margin: 0,
    lineHeight: 1.6,
  },
};
