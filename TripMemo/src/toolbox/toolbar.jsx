import "./toolbox.css";

function tbi(i) {
  return `http://localhost:5000/icons/${i}.svg`;
}

function Tools({ tool, setTool, onSave, setActiveTab, memoryName, memoryId }) {
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
        // gap: "clamp(16px, 3vw, 30px)",
      }}
    >
      {["selection", "line", "rectangle", "pencil", "text"].map((icon) => (
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
      ))}

      <button
        onClick={() => setActiveTab("upload")}
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
        style={{ width: "clamp(25px, 25px, 85px)", height: "auto" }}
        src={tbi("upload")}/>
      </button>

      {/* SAVE BUTTON */}
      <button
        onClick={onSave}
        style={{
          marginTop: "20px",
          padding: "10px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#4CAF50",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Save
      </button>

    </div>
  );
}

export default Tools;
