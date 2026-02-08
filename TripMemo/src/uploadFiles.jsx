import { useState } from "react";
import ExifReader from "exifreader";

export default function UploadFiles({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [metadata, setMetadata] = useState(null);

  async function extractMetadataFromFile(file) {
    // read the raw bytes from the uploaded file (client-side)
    const buffer = await file.arrayBuffer();

    // parse EXIF (and other tags) from those bytes
    const tags = ExifReader.load(buffer, { expanded: true });

    return {
      gpsLatitude: tags?.gps?.Latitude?.description ?? null,
      gpsLongitude: tags?.gps?.Longitude?.description ?? null,
      make: tags?.exif?.Make?.description ?? null,
      model: tags?.exif?.Model?.description ?? null,
      dateTimeOriginal: tags?.exif?.DateTimeOriginal?.description ?? null,
      orientation: tags?.image?.Orientation?.description ?? null,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    setStatus("Reading EXIF...");

    let meta;
    try {
      meta = await extractMetadataFromFile(file);
      setMetadata(meta);
    } catch (err) {
      console.error(err);
      setStatus("Could not read EXIF (image may have none).");
      meta = null;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user", "Tim");
    formData.append("metadata", JSON.stringify(meta)); // send EXIF to backend too

    setStatus("Uploading...");

    try {
      const res = await fetch("http://localhost:5000/process-images", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setStatus("Upload failed");
        return;
      }

      const data = await res.json();
      setStatus("Upload complete");

      onUploadComplete?.(data);
    } catch (err) {
      console.error(err);
      setStatus("Error connecting to server");
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
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
            <p><strong>Name:</strong> {file.name}</p>
            <p><strong>Size:</strong> {file.size} bytes</p>
          </div>
        )}

        {metadata && (
          <pre className="mt-4 text-xs bg-gray-950 p-3 rounded-lg overflow-auto">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
