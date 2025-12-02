import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import { exiftool } from "exiftool-vendored";
import NodeGeocoder from "node-geocoder";
import fs from "fs";

// ---------------------------------------------
// MASTER FUNCTION
// ---------------------------------------------
export default async function processImages(imagePaths) {

  // ---------- Setup geocoder ----------
  const geocoder = NodeGeocoder({
    provider: "opencage",
    apiKey: process.env.opencageApiKey
  });

  const result = {
    imagesBase64: [],
    metaData: [],
    gpsArray: [],
    locationsArray: []
  };

  // ---------- Convert to base64 ----------
  function convertToBase64(paths) {
    return paths.map(p => ({
      path: p,
      base64: fs.readFileSync(p, "base64")
    }));
  }

  // ---------- Extract EXIF ----------
  async function extractMetadata(imagePaths) {
    const out = [];

    try {
      for (const p of imagePaths) {
        try {
          const meta = await exiftool.readRaw(p, ["-n", "-GPSLatitude", "-GPSLongitude"]);
          out.push({ path: p, metadata: meta });
        } catch {
          out.push({
            path: p,
            metadata: { GPSLatitude: null, GPSLongitude: null }
          });
        }
      }
    } finally {
      await exiftool.end();
    }

    return out;
  }

  // ---------- Reverse geocode ----------
  async function extractLocations(gpsArray) {
    const locations = [];

    for (const item of gpsArray) {
      if (!item.lat || !item.lon) {
        locations.push({ ...item, location: "No GPS metadata" });
        continue;
      }

      try {
        const res = await geocoder.reverse({ lat: item.lat, lon: item.lon });
        const g = res[0];

        locations.push({
          ...item,
          location: [g.streetName, g.city, g.county, g.country]
            .filter(Boolean)
            .join(", ")
        });

      } catch {
        locations.push({ ...item, location: "Error retrieving location" });
      }
    }

    return locations;
  }

  // ---------- PIPELINE ----------
  result.imagesBase64 = convertToBase64(imagePaths);

  const metadataResults = await extractMetadata(imagePaths);
  result.metaData = metadataResults;

  result.gpsArray = metadataResults.map(m => ({
    path: m.path,
    lat: m.metadata.GPSLatitude ?? null,
    lon: m.metadata.GPSLongitude ?? null
  }));

  result.locationsArray = await extractLocations(result.gpsArray);

  // ---------- SEND TO GEMINI ----------
  const ai = new GoogleGenerativeAI(process.env.geminiApiKey);
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const parts = [
    { text: "Extract information from these images and metadata." },
    {
      text: "Respond ONLY with a JSON array of strings in this exact format: [\"galway\",\"christmas market\",\"volleyball\"]"
    },
    {
      text: "Choose only relevant single-word or short tags from: ['galway','laptop','notes','newyorkcity','desk','drawing','black hoodie']."
    },
    { text: "Do not include explanations. Output only the array." },
    { text: "Metadata:\n" + JSON.stringify(result, null, 2) },
    { text: "Locations:\n" + JSON.stringify(result.locationsArray, null, 2) }
  ];

  // attach images
  for (const img of result.imagesBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: img.base64
      }
    });
  }

  try {
    const LLMresult = await model.generateContent({
      contents: [{ role: "user", parts }]
    });

    return LLMresult.response.text();

  } catch (err) {
    console.log("LLM error:", err);
    console.warn("LLM error → returning fallback tags.");
    return `["galway","christmas market","volleyball"]`;
  }
}

 processImages(["./IMG_3974.HEIC"]);