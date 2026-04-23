import { useState } from "react";

export default function ImageDropWidget() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  return (
    <>
      {/* MAIN BOX (IDENTICAL STYLE) */}
      <div
        draggable={!!url}
        onDragStart={(e) => {
          if (!url) return;

          e.dataTransfer.setData("text/plain", url);
        }}
        className="w-52 h-52 rounded-xl overflow-hidden relative cursor-pointer group border border-gray-300"
      >
        {/* IMAGE */}
        {url ? (
          <img
            src={`http://https://tripmemo-11.onrender.com/api/image-proxy?url=${encodeURIComponent(url)}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
            No image selected
          </div>
        )}

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition" />

        {/* BUTTON */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-white/90 text-black rounded-md text-sm font-medium opacity-90 hover:opacity-100"
          >
            {url ? "Change Image" : "Add Image"}
          </button>
        </div>
      </div>

      {/* POPUP (MATCHES DEEZER STYLE) */}
      {open && (
        <div className="fixed top-[20%] left-1/2 -translate-x-1/2 bg-white p-5 rounded-xl shadow-xl z-[99999] w-[400px]">
          <input
            placeholder="Paste image URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-2 border rounded-md mb-2"
          />

          <button
            onClick={() => setOpen(false)}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Done
          </button>

          <button
            onClick={() => setOpen(false)}
            className="mt-3 w-full text-sm text-gray-500 hover:text-black"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}