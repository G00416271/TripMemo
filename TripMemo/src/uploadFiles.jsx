// DROP-IN REPLACEMENT: robust GPS extraction + parsing (keeps your existing component structure)

import { useState } from "react";
import ExifReader from "exifreader";
import { useAuth } from "./Auth.jsx";

// ---- helpers (drop-in) ----
function pickTag(tags, paths) {
  for (const p of paths) {
    const parts = p.split(".");
    let cur = tags;
    for (const part of parts) cur = cur?.[part];
    if (cur?.description != null) return cur.description;
    if (cur?.value != null) return cur.value;
  }
  return null;
}

function toDecimalDegrees(value, ref) {
  // value can be: "53° 20' 12.34\"" or [53,20,12.34] or [{numerator,denominator},...]
  const sign = ref === "S" || ref === "W" ? -1 : 1;

  // Case 1: already a number
  if (typeof value === "number") return value * sign;

  // Case 2: array forms
  if (Array.isArray(value)) {
    const nums = value.map((v) => {
      if (typeof v === "number") return v;
      if (typeof v === "string") return parseFloat(v);
      if (v && typeof v === "object") {
        // rational
        if ("numerator" in v && "denominator" in v && v.denominator) {
          return v.numerator / v.denominator;
        }
      }
      return NaN;
    });

    const [d, m = 0, s = 0] = nums;
    if ([d, m, s].some((x) => Number.isNaN(x))) return null;
    return sign * (Math.abs(d) + m / 60 + s / 3600);
  }

  // Case 3: string like "53° 20' 12.34\"" or "53,20,12.34"
  if (typeof value === "string") {
    const cleaned = value
      .replace(/[^\d.+-]+/g, " ")
      .trim()
      .split(/\s+/)
      .map((x) => parseFloat(x));

    const [d, m = 0, s = 0] = cleaned;
    if ([d, m, s].some((x) => Number.isNaN(x))) return null;
    return sign * (Math.abs(d) + m / 60 + s / 3600);
  }

  return null;
}

function extractGps(tags) {
  // Try multiple common tag names/structures
  const latRaw = pickTag(tags, [
    "gps.Latitude",
    "gps.GPSLatitude",
    "GPSLatitude", // some outputs flatten
  ]);

  const lonRaw = pickTag(tags, [
    "gps.Longitude",
    "gps.GPSLongitude",
    "GPSLongitude",
  ]);

  const latRef = pickTag(tags, [
    "gps.LatitudeRef",
    "gps.GPSLatitudeRef",
    "GPSLatitudeRef",
  ]);

  const lonRef = pickTag(tags, [
    "gps.LongitudeRef",
    "gps.GPSLongitudeRef",
    "GPSLongitudeRef",
  ]);

  if (latRaw == null || lonRaw == null) {
    return { gpsLatitude: null, gpsLongitude: null };
  }

  const lat = toDecimalDegrees(latRaw, latRef);
  const lon = toDecimalDegrees(lonRaw, lonRef);

  return {
    gpsLatitude: lat ?? null,
    gpsLongitude: lon ?? null,
  };
}

// ---- your component ----
export default function UploadFiles({
  onUploadComplete,
  onAddToCanvas,
  memoryId,
  memoryName,
  onFilesReady,
}) {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [metadataList, setMetadataList] = useState([]);
  const { user } = useAuth();

  async function extractMetadataFromFile(file) {
    const buffer = await file.arrayBuffer();
    const tags = ExifReader.load(buffer, { expanded: true });

    const gps = extractGps(tags);

    return {
      fileName: file.name,
      fileSize: file.size,

      ...gps, // ✅ decimal degrees or null

      make: pickTag(tags, ["exif.Make"]) ?? null,
      model: pickTag(tags, ["exif.Model"]) ?? null,
      dateTimeOriginal: pickTag(tags, ["exif.DateTimeOriginal"]) ?? null,
      orientation: pickTag(tags, ["image.Orientation"]) ?? null,
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
        })
      );
      setMetadataList(metas);
    } catch (err) {
      console.error(err);
      setStatus("Could not read EXIF.");
      metas = [];
    }

    const formData = new FormData();
    for (const f of files) formData.append("files", f);

    formData.append("user", user.username);
    formData.append("memory_id", memoryId);
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
      onFilesReady?.(files);
      onUploadComplete?.(data);
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
            multiple
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