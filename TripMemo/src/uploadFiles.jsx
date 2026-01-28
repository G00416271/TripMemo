import { useState } from "react";

export default function UploadFiles({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    // ---------- Extract EXIF ----------
    async function extractMetadata(imagePaths) {
      const out = [];

      try {
        for (const p of imagePaths) {
          try {
            const meta = await exiftool.readRaw(p, [
              "-n",
              "-GPSLatitude",
              "-GPSLongitude",
            ]);
            out.push({ path: p, metadata: meta });
          } catch {
            out.push({
              path: p,
              metadata: { GPSLatitude: null, GPSLongitude: null },
            });
          }
        }
      } finally {
        await exiftool.end();
      }

      return out;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user", "Tim");

    setStatus("Uploading...");

    try {
      const res = await fetch("http://localhost:5000/process-images", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setStatus("Upload complete ");

        const data = await res.json();

        // 🔥 send data back to App.jsx
        if (onUploadComplete) {
          onUploadComplete(data);
        }
      } else {
        setStatus("Upload failed ");
      }
    } catch (err) {
      setStatus("Error connecting to server ");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">File Upload</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-300 
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-lg file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-600 file:text-white
                       hover:file:bg-blue-700"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
          >
            Upload
          </button>
        </form>

        {status && <p className="mt-4 text-center text-gray-300">{status}</p>}

        {file && (
          <div className="mt-4 text-sm text-gray-400">
            <p>
              <strong>Name:</strong> {file.name}
            </p>
            <p>
              <strong>Size:</strong> {file.size} bytes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
