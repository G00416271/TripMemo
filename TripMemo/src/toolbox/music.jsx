import { useState } from "react";
import { proxy } from "../proxy"; // Import the proxy function for image URLs
export default function DeezerWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  async function search() {
    if (!query) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/deezer/search?q=${encodeURIComponent(query)}`,
      );

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      {/* MAIN BOX */}
      <div
        draggable={!!selected}
        onDragStart={(e) => {
          if (!selected) return;

          e.dataTransfer.setData(
            "application/json",
            JSON.stringify({
              type: "deezer-track",
              image: selected.cover,
              title: selected.title,
              artist: selected.artist,
              preview: selected.preview,
            }),
          );
        }}
        className="w-52 h-52 rounded-xl overflow-hidden relative cursor-pointer group border border-gray-300"
      >
        {/* IMAGE (fills box) */}
        {selected ? (
          <img src={proxy(selected.cover)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
            No song selected
          </div>
        )}

        {/* DARK OVERLAY ON HOVER */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition" />

        {/* BUTTON OVERLAY */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-white/90 text-black rounded-md text-sm font-medium opacity-90 hover:opacity-100"
          >
            {selected ? "Change Song" : "Search Song"}
          </button>
        </div>
      </div>

      {/* POPUP */}
      {open && (
        <div className="fixed top-[20%] left-1/2 -translate-x-1/2 bg-white p-5 rounded-xl shadow-xl z-[99999] w-[400px]">
          <input
            placeholder="Search song..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-2 border rounded-md mb-2"
          />

          <button
            onClick={search}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Search
          </button>

          <div className="max-h-[300px] overflow-y-auto mt-3 space-y-2">
            {Array.isArray(results) &&
              results.map((track) => (
                <div
                  key={track.id}
                  onClick={() => {
                    setSelected(track);
                    setOpen(false);
                  }}
                  className="flex gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                >
                  <img
                    src={track.cover}
                    className="w-10 h-10 object-cover rounded"
                  />

                  <div>
                    <div className="text-sm font-medium">{track.title}</div>
                    <div className="text-xs text-gray-500">{track.artist}</div>
                  </div>
                </div>
              ))}
          </div>

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
