import { useRef, useState } from "react";
import "./toolbox.css";

function tbi(i) {
  return `http://https://tripmemo-11.onrender.com/icons/${i}.svg`;
}

function Tools({ tool, setTool, onSave, onPickFiles }) {
  const fileInputRef = useRef(null);
  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved"

  const handleSave = async () => {
    if (saveState !== "idle") return;
    setSaveState("saving");
    try {
      await onSave?.();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1400);
    } catch (err) {
      console.error(err);
      setSaveState("idle");
    }
  };

  const getSaveButtonStyle = () => {
    const base = {
      marginTop: "20px",
      padding: "10px",
      borderRadius: "8px",
      border: "none",
      color: "white",
      fontWeight: "bold",
      cursor: saveState === "idle" ? "pointer" : "default",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 40,
      transition:
        "background-color 0.25s ease, transform 0.15s ease, box-shadow 0.25s ease",
      position: "relative",
      overflow: "hidden",
    };
    if (saveState === "saving") {
      return {
        ...base,
        backgroundColor: "#6aaf6d",
        transform: "scale(0.97)",
        boxShadow: "inset 0 2px 6px rgba(0,0,0,0.15)",
      };
    }
    if (saveState === "saved") {
      return {
        ...base,
        backgroundColor: "#2e8b34",
        transform: "scale(1.04)",
        boxShadow: "0 4px 14px rgba(46,139,52,0.45)",
      };
    }
    return {
      ...base,
      backgroundColor: "#4CAF50",
      transform: "scale(1)",
      boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
    };
  };

  return (
    <div
      style={{
        color: "black",
        textAlign: "start",
        position: "fixed",
        top: "clamp(5%, 10%, 20%)",
        width: "clamp(15%, 10%, 15%)",
        left: "clamp(1%, 1vw, 20px)",
        zIndex: 1000,
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        margin: 0,
        borderRadius: "10pt",
        padding: "clamp(8px, 1vw, 14px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* keyframes injected once */}
      <style>{`
        @keyframes tb-spin { to { transform: rotate(360deg); } }
        @keyframes tb-pop {
          0%   { transform: scale(0) rotate(-45deg); opacity: 0; }
          60%  { transform: scale(1.3) rotate(0deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes tb-shine {
          0%   { left: -60%; }
          100% { left: 140%; }
        }
        .tb-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: tb-spin 0.7s linear infinite;
        }
        .tb-check {
          display: inline-block;
          animation: tb-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          font-size: 18px;
          line-height: 1;
        }
        .tb-shine {
          position: absolute;
          top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255,255,255,0.55) 50%,
            transparent 100%
          );
          animation: tb-shine 0.7s ease-out;
          pointer-events: none;
        }
      `}</style>

      {["selection", "pencil", "rectangle", "line", "text", "eraser"].map(
        (icon) => (
          <div
            key={icon}
            className={`toolbar-item ${tool === icon ? "active-tool" : ""}`}
            onClick={() => setTool(icon)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              margin: "10px",
              padding: "6px",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "0.2s",
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            <img
              src={tbi(icon)}
              alt={`${icon} icon`}
              style={{ width: "clamp(20px, 20px, 80px)", height: "auto" }}
            />
            <span style={{ fontSize: "16px", paddingLeft: "4px" }}>
              {icon.charAt(0).toUpperCase() + icon.slice(1)}
            </span>
          </div>
        ),
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          onPickFiles?.(files);
          e.target.value = "";
        }}
      />

      <button onClick={() => fileInputRef.current?.click()}>Upload</button>

      <button
        onClick={handleSave}
        disabled={saveState !== "idle"}
        style={getSaveButtonStyle()}
      >
        {saveState === "idle" && <span>Save</span>}
        {saveState === "saving" && (
          <>
            <span className="tb-spinner" />
            <span>Saving…</span>
          </>
        )}
        {saveState === "saved" && (
          <>
            <span className="tb-check">✓</span>
            <span>Saved</span>
            <span className="tb-shine" />
          </>
        )}
      </button>
    </div>
  );
}

export default Tools;