import React, { useState, useEffect } from "react";

import CanvasThumbnail from "./CanvasThumbnail";
import {
  FiArrowLeft,
  FiPlus,
  FiMoreVertical,
  FiShare2,
  FiTrash2,
} from "react-icons/fi";

export default function Memories({
  setActiveTab,
  setSelectedMemoryId,
  setSelectedMemoryName,
  setUploadedFiles,
  userId,
}) {
  const [memories, setMemories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [memoryName, setMemoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState(null);
  const [privacy, setPrivacy] = useState("public");

  const DBentry = async (user_id, mn, privacy_level) => {
    const fd = new FormData();
    fd.append("action", "create");
    fd.append("user_id", String(user_id));
    fd.append("title", mn);
    fd.append("privacy_level", privacy_level);
    const res = await fetch("https://tripmemo-11.onrender.com/memories", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error("Create failed");
    return res.json();
  };

  const DBdelete = async (memory_id) => {
    const fd = new FormData();
    fd.append("action", "delete");
    fd.append("memory_id", String(memory_id));
    fd.append("user_id", String(userId));
    const res = await fetch("https://tripmemo-11.onrender.com/memories", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error("Memory delete failed");
    return res.json();
  };

  const deleteCanvas = async (memoryId) => {
    const res = await fetch(
      `https://tripmemo-11.onrender.com/api/canvas/delete?memoryId=${memoryId}`,
      { method: "DELETE" },
    );
    if (res.status === 404) return;
    if (!res.ok) throw new Error(`Canvas delete failed: ${res.status}`);
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const fd = new FormData();
    fd.append("action", "fetch");
    fd.append("user_id", userId);
    fetch("https://tripmemo-11.onrender.com/memories", { method: "POST", body: fd })
      .then((res) => res.json())
      .then((data) => {
        setMemories(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, [userId]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const title = memoryName.trim();
    if (!title) return;
    if (!userId) {
      console.error("handleSubmit: userId is null/undefined — cannot create memory");
      return;
    }
    try {
      const created = await DBentry(userId, title, privacy);
      if (created?.memory) {
        setMemories((prev) => [...prev, created.memory]);
        setMemoryName("");
        setPrivacy("public");
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMenu = (memoryId, e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === memoryId ? null : memoryId);
  };

  const handleDeleteClick = (memoryId, e) => {
    e.stopPropagation();
    setMemoryToDelete(memoryId);
    setShowDeleteConfirm(true);
    setActiveMenu(null);
  };

  const handleShareClick = (memoryId, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/share/${memoryId}`;
    navigator.clipboard.writeText(url).then(() => alert("Share link copied!"));
    setActiveMenu(null);
  };

  const handlePrivacyToggle = async (memoryId, currentPrivacy) => {
    // treat null/undefined as "public" before toggling
    const resolved = currentPrivacy ?? "public";
    const newPrivacy = resolved === "public" ? "private" : "public";

    const fd = new FormData();
    fd.append("action", "update_privacy");
    fd.append("memory_id", String(memoryId));
    fd.append("privacy_level", newPrivacy);

    try {
      await fetch("https://tripmemo-11.onrender.com/memories", { method: "POST", body: fd });
      setMemories((prev) =>
        prev.map((m) =>
          m.memory_id === memoryId ? { ...m, privacy_level: newPrivacy } : m,
        ),
      );
    } catch (err) {
      console.error("Failed to update privacy:", err);
    }
  };

  const confirmDelete = async () => {
    if (!memoryToDelete) return;
    try {
      await deleteCanvas(memoryToDelete);
      await DBdelete(memoryToDelete);
      setMemories((prev) => prev.filter((m) => m.memory_id !== memoryToDelete));
    } catch (err) {
      console.error(err);
    } finally {
      setShowDeleteConfirm(false);
      setMemoryToDelete(null);
    }
  };

  const handleCardClick = async (memoryId, memoryTitle) => {
    setUploadedFiles([]);
    setSelectedMemoryId(memoryId);
    setSelectedMemoryName(memoryTitle);
    try {
      const res = await fetch(
        `https://tripmemo-11.onrender.com/api/canvas/load?memoryId=${memoryId}`,
      );
      if (!res.ok) throw new Error("Load failed");
      const data = await res.json();
      setActiveTab(data.items?.length > 0 ? "canvas" : "upload");
    } catch (err) {
      console.error(err);
      setActiveTab("upload");
    }
  };

  // Resolves null/undefined privacy to "public"
  const resolvePrivacy = (raw) => raw ?? "public";

  return (
    <div style={styles.page}>
      {/* ── Overlay ── */}
      {(showForm || showDeleteConfirm) && (
        <div
          style={styles.overlay}
          onClick={() => {
            if (showForm) { setShowForm(false); setMemoryName(""); }
            if (showDeleteConfirm) { setShowDeleteConfirm(false); setMemoryToDelete(null); }
          }}
        />
      )}

      {/* Click-outside to close dropdown */}
      {activeMenu && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 20 }}
          onClick={() => setActiveMenu(null)}
        />
      )}

      {/* ── Create form sheet ── */}
      <div
        style={{
          ...styles.sheet,
          transform: showForm ? "translateY(0)" : "translateY(-110%)",
        }}
      >
        <h2 style={styles.sheetTitle}>New Scrapbook</h2>
        <input
          type="text"
          value={memoryName}
          onChange={(e) => setMemoryName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Give it a name..."
          style={styles.sheetInput}
          autoFocus={showForm}
        />

        {/* Privacy toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["public", "private", "friends"].map((level) => (
            <button
              key={level}
              onClick={() => setPrivacy(level)}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 10,
                border: "1.5px solid",
                borderColor: privacy === level ? "#FF0055" : "rgba(26,22,37,0.1)",
                background: privacy === level ? "rgba(255,0,85,0.08)" : "#f4f5f7",
                color: privacy === level ? "#FF0055" : "#9a9a9a",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.18s",
              }}
            >
              {level === "public" ? "🌍" : level === "private" ? "🔒" : "👥"}{" "}
              {level}
            </button>
          ))}
        </div>

        <div style={styles.sheetActions}>
          <button
            style={styles.btnCancel}
            onClick={() => { setShowForm(false); setMemoryName(""); }}
          >
            Cancel
          </button>
          <button style={styles.btnCreate} onClick={handleSubmit}>
            Create
          </button>
        </div>
      </div>

      {/* ── Delete confirm sheet ── */}
      <div
        style={{
          ...styles.sheet,
          transform: showDeleteConfirm ? "translateY(0)" : "translateY(-110%)",
        }}
      >
        <h2 style={styles.sheetTitle}>Delete Scrapbook?</h2>
        <p style={styles.sheetBody}>
          This action can't be undone. All canvas content will be permanently removed.
        </p>
        <div style={styles.sheetActions}>
          <button
            style={styles.btnCancel}
            onClick={() => { setShowDeleteConfirm(false); setMemoryToDelete(null); }}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.btnCreate, background: "#FF3B30" }}
            onClick={confirmDelete}
          >
            Delete
          </button>
        </div>
      </div>

      {/* ── Header ── */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => setActiveTab("home")}>
          <FiArrowLeft size={18} />
          <span>Back</span>
        </button>
        <h1 style={styles.pageTitle}>My Scrapbooks</h1>
        <button style={styles.createBtn} onClick={() => setShowForm(true)}>
          <FiPlus size={16} />
          New
        </button>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={styles.emptyState}>
          <div style={styles.spinner}>◌</div>
          <p style={{ color: "#9a9a9a", marginTop: 12 }}>Loading scrapbooks…</p>
        </div>
      ) : memories.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📖</div>
          <p style={styles.emptyTitle}>No scrapbooks yet</p>
          <p style={styles.emptySubtitle}>Tap "New" to create your first one</p>
          <button style={styles.emptyBtn} onClick={() => setShowForm(true)}>
            <FiPlus size={14} /> Create Scrapbook
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {/* Add card */}
          <button style={styles.addCard} onClick={() => setShowForm(true)}>
            <div style={styles.addIcon}>+</div>
            <span style={styles.addLabel}>New Scrapbook</span>
          </button>

          {memories.map((memory) => {
            const level = resolvePrivacy(memory.privacy_level);
            const isPublic = level === "public";
            const isFriends = level === "friends";

            const badgeBg = isPublic
              ? "rgba(0,216,255,0.15)"
              : isFriends
              ? "rgba(178,75,243,0.15)"
              : "rgba(26,22,37,0.12)";
            const badgeColor = isPublic ? "#00a8c8" : isFriends ? "#b24bf3" : "#555";
            const badgeEmoji = isPublic ? "🌍" : isFriends ? "👥" : "🔒";

            return (
              <div
                key={memory.memory_id}
                style={styles.card}
                onClick={() => handleCardClick(memory.memory_id, memory.title)}
              >
                {/* Three-dot menu */}
                <button
                  style={styles.menuBtn}
                  onClick={(e) => toggleMenu(memory.memory_id, e)}
                  aria-label="Options"
                >
                  <FiMoreVertical size={16} />
                </button>

                {/* Privacy badge */}
                <div style={{ ...styles.privacyBadge, background: badgeBg, color: badgeColor }}>
                  {badgeEmoji} {level.charAt(0).toUpperCase() + level.slice(1)}
                </div>

                {/* Dropdown */}
                {activeMenu === memory.memory_id && (
                  <div style={styles.dropdown}>
                    <button
                      style={styles.dropdownItem}
                      onClick={(e) => handleShareClick(memory.memory_id, e)}
                    >
                      <FiShare2 size={14} />
                      Share
                    </button>

                    {/* Privacy toggle — label shows what it will CHANGE TO */}
                    <button
                      style={styles.dropdownItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrivacyToggle(memory.memory_id, level);
                        setActiveMenu(null);
                      }}
                    >
                      {isPublic ? "🔒" : "🌍"}
                      {isPublic ? " Make Private" : " Make Public"}
                    </button>

                    <button
                      style={{ ...styles.dropdownItem, color: "#FF3B30" }}
                      onClick={(e) => handleDeleteClick(memory.memory_id, e)}
                    >
                      <FiTrash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}

                {/* Canvas thumbnail */}
                <div style={styles.thumbnail}>
                  <CanvasThumbnail
                    memoryId={memory.memory_id}
                    memoryTitle={memory.title}
                    width={320}
                    height={180}
                    showShareBtn={false}
                    showExportBtn={false}
                  />
                </div>

                {/* Card footer */}
                <div style={styles.cardFooter}>
                  <h3 style={styles.cardTitle}>{memory.title}</h3>
                  <p style={styles.cardDate}>
                    {new Date(memory.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes memoriesSpin {
          to { transform: rotate(360deg); }
        }
        .mem-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 12px 32px rgba(26,22,37,0.14) !important;
          border-color: rgba(255,0,85,0.18) !important;
        }
        .mem-add:hover {
          border-color: #FF0055 !important;
          background: rgba(255,0,85,0.06) !important;
          transform: translateY(-2px) !important;
        }
        .mem-menu-btn:hover { background: rgba(26,22,37,0.08) !important; }
        .mem-create-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .mem-back-btn:hover { color: #151515 !important; background: #f4f5f7 !important; }
        .mem-dropdown-item:hover { background: #f4f5f7 !important; }
      `}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100%",
    background: "#f0f0f2",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    position: "relative",
    paddingBottom: 100,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 40,
  },
  sheet: {
    position: "fixed",
    top: 0,
    left: "50%",
    transform: "translateX(-50%) translateY(-110%)",
    width: "min(480px, 92vw)",
    background: "#fff",
    borderRadius: "0 0 24px 24px",
    boxShadow: "0 8px 40px rgba(26,22,37,0.18)",
    padding: "32px 28px 28px",
    zIndex: 50,
    transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
  },
  sheetTitle: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: 22,
    fontWeight: 800,
    color: "#151515",
    margin: "0 0 16px",
  },
  sheetBody: {
    fontSize: 14,
    color: "#9a9a9a",
    lineHeight: 1.6,
    margin: "0 0 24px",
  },
  sheetInput: {
    width: "100%",
    padding: "13px 16px",
    border: "1.5px solid rgba(26,22,37,0.12)",
    borderRadius: 14,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 15,
    color: "#151515",
    background: "#f4f5f7",
    outline: "none",
    marginBottom: 20,
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  sheetActions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
  btnCancel: {
    padding: "10px 20px",
    borderRadius: 12,
    border: "1.5px solid rgba(26,22,37,0.1)",
    background: "#f4f5f7",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
    cursor: "pointer",
  },
  btnCreate: {
    padding: "10px 22px",
    borderRadius: 12,
    border: "none",
    background: "#FF0055",
    fontFamily: "'Nunito', sans-serif",
    fontSize: 14,
    fontWeight: 800,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(255,0,85,0.3)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "20px 22px 16px",
    background: "#fff",
    borderBottom: "1px solid rgba(26,22,37,0.06)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: "#9a9a9a",
    cursor: "pointer",
    transition: "color 0.2s, background 0.2s",
    flexShrink: 0,
  },
  pageTitle: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: 22,
    fontWeight: 800,
    color: "#151515",
    margin: 0,
    flex: 1,
    letterSpacing: "-0.02em",
  },
  createBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 16px",
    borderRadius: 12,
    border: "none",
    background: "#FF0055",
    fontFamily: "'Nunito', sans-serif",
    fontSize: 13,
    fontWeight: 800,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(255,0,85,0.28)",
    transition: "opacity 0.2s, transform 0.2s",
    flexShrink: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 18,
    padding: "22px 22px 32px",
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    border: "1.5px solid rgba(26,22,37,0.07)",
    boxShadow: "0 4px 16px rgba(26,22,37,0.08)",
    cursor: "pointer",
    position: "relative",
    transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s, border-color 0.22s",
  },
  menuBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 5,
    width: 32,
    height: 32,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#333",
    transition: "background 0.18s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  privacyBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 5,
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    backdropFilter: "blur(6px)",
    textTransform: "capitalize",
  },
  dropdown: {
    position: "absolute",
    top: 46,
    right: 10,
    zIndex: 30,
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 8px 28px rgba(26,22,37,0.16)",
    border: "1.5px solid rgba(26,22,37,0.07)",
    overflow: "hidden",
    minWidth: 155,
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "12px 16px",
    border: "none",
    background: "transparent",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "#333",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.15s",
  },
  thumbnail: {
    width: "100%",
    overflow: "hidden",
    display: "block",
    lineHeight: 0,
  },
  cardFooter: {
    padding: "14px 16px 16px",
  },
  cardTitle: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: 16,
    fontWeight: 800,
    color: "#151515",
    margin: "0 0 4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardDate: {
    fontSize: 12,
    color: "#9a9a9a",
    margin: 0,
    fontWeight: 500,
  },
  addCard: {
    background: "#fff",
    borderRadius: 20,
    border: "2px dashed rgba(255,0,85,0.25)",
    boxShadow: "0 2px 10px rgba(26,22,37,0.06)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 230,
    transition: "border-color 0.22s, background 0.22s, transform 0.22s",
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #FF0055, #ff6b9d)",
    color: "#fff",
    fontSize: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 14px rgba(255,0,85,0.28)",
  },
  addLabel: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: "#9a9a9a",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    textAlign: "center",
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: 20,
    fontWeight: 800,
    color: "#151515",
    margin: "0 0 8px",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9a9a9a",
    margin: "0 0 24px",
  },
  emptyBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "11px 22px",
    borderRadius: 14,
    border: "none",
    background: "#FF0055",
    fontFamily: "'Nunito', sans-serif",
    fontSize: 14,
    fontWeight: 800,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(255,0,85,0.28)",
  },
  spinner: {
    fontSize: 32,
    color: "#FF0055",
    animation: "memoriesSpin 1.2s linear infinite",
    display: "inline-block",
  },
};