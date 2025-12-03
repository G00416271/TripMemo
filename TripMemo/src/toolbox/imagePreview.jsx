export default function ImagePreview({ image, onClose }) {
  if (!image) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999999,
        padding: 20,
      }}
      onClick={onClose}
    >
      <img
        src={image.largeImageURL || image.webformatURL}
        style={{
          maxWidth: "90%",
          maxHeight: "90%",
          borderRadius: 12,
          boxShadow: "0 0 20px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
}
