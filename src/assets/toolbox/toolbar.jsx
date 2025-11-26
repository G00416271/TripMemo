import "./toolbox.css";

function tbi(i) {
  return `http://localhost:5000/icons/${i}.svg`;
}

function Tools({ tool, setTool }) {
  return (
    <div
      style={{
        color: "black",
        textAlign: "start",
        position: "fixed",
        top: "25%",
        width: "10%",
        zIndex: 1000,
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        margin: 0,
        left: "4px",
        borderRadius: "10pt",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "30px",
      }}
    >
      {["selection", "line", "rectangle", "pencil", "text"].map((icon) => (
        <div
          key={icon}
          className={`toolbar-item ${tool === icon ? "active-tool" : ""}`}
          onClick={() => setTool(icon)}   // <-- IMPORTANT
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
            style={{ width: 40, height: 40 }}
          />
          <span style={{ fontSize: "16px", paddingLeft: "4px" }}>
            {icon.charAt(0).toUpperCase() + icon.slice(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default Tools;
