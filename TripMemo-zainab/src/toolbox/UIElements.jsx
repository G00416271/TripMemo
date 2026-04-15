function SizeBadge({ scale, setScale }) {
  return (
    <div
    onClick={() => setScale(1)}
      style={{
        position: "fixed",
        bottom: "05%",
        right: "05%",
        backgroundColor: "#ffffff",
        color: "black",
        padding: "12px 20px",
        borderRadius: "50px",
        fontFamily: "Arial, sans-serif",
        fontSize: "26px",
        boxShadow: "0 0.25 0.2 0.2px rgba(0, 0, 0, 0.5)",
        zIndex: 2000,
        cursor: "pointer"
      }}
    >
      Zoom: {(scale * 100).toFixed(0)}%
    </div>
  );
}

export default SizeBadge;