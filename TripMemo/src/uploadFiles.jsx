import { useState } from "react";
import ExifReader from "exifreader";
import { useAuth } from "./Auth.jsx";

export default function UploadFiles({
  onUploadComplete,
  onAddToCanvas,
  memoryId,
  memoryName,
  onFilesReady,
}) {
  const [files, setFiles] = useState([]); // ✅ multiple
  const [status, setStatus] = useState("");
  const [metadataList, setMetadataList] = useState([]); // ✅ metadata per file
  const { user } = useAuth();

  async function extractMetadataFromFile(file) {
    const buffer = await file.arrayBuffer();
    const tags = ExifReader.load(buffer, { expanded: true });

    return {
      fileName: file.name,
      fileSize: file.size,

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

    if (files.length === 0) return;

    if (!memoryId) {
      setStatus("No memory selected.");
      return;
    }

    setStatus("Reading EXIF...");

    let metas = [];
    try {
      metas = await Promise.all(
        files.map(async (f) => {
          try {
            return await extractMetadataFromFile(f);
          } catch {
            return { fileName: f.name, error: "No EXIF or unreadable" };
          }
        }),
      );
      setMetadataList(metas);
      console.log(metas);
    } catch (err) {
      console.error(err);
      setStatus("Could not read EXIF.");
      metas = [];
    }

    const formData = new FormData();

    // ✅ append all files (same key name)
    for (const f of files) {
      formData.append("files", f);
    }

    formData.append("user", user.username);
    formData.append("memory_id", memoryId);

    // ✅ send an array of metadata (same order as files)
    formData.append("metadata", JSON.stringify(metas));

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
      onFilesReady?.(files); // ✅ send files to App
      onUploadComplete?.(data); // ✅ send server response to App

      //files.forEach((f) => onAddToCanvas?.(f));
    } catch (err) {
      console.error(err);
      setStatus("Error connecting to server");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          File Upload
          <div className="text-2xl font-bold mb-6 text-center">
            {memoryId + " " + memoryName}
          </div>
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple // ✅ allow many
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
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

        {files.length > 0 && (
          <div className="mt-4 text-sm text-gray-400">
            <p>
              <strong>Selected:</strong> {files.length} file(s)
            </p>
            <ul className="mt-2 list-disc pl-5">
              {files.map((f) => (
                <li key={f.name}>
                  {f.name} — {f.size} bytes
                </li>
              ))}
            </ul>
          </div>
        )}

        {metadataList.length > 0 && (
          <pre className="mt-4 text-xs bg-gray-950 p-3 rounded-lg overflow-auto">
            {JSON.stringify(metadataList, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
