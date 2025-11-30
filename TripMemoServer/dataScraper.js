import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import { exiftool } from "exiftool-vendored";
import NodeGeocoder from "node-geocoder";
import fs from "fs";
import path from "path";
import e from "express";

// ---------------------------------------------
// MASTER FUNCTION
// ---------------------------------------------
export default async function processImages(imagePaths) {

  // ---------- Setup geocoder ----------
  const geocoder = NodeGeocoder({
    provider: "opencage",
    apiKey: process.env.opencageApiKey
  });

  // ---------- RESULT STORE ----------
  const result = {
    imagesBase64: [],
    metaData: [],
    gpsArray: [],
    locationsArray: []
  };

  // ---------- Helper: Convert to base64 ----------
  function convertToBase64(paths) {
    return paths.map(p => ({
      path: p,
      base64: fs.readFileSync(p, "base64")
    }));
  }

  // ---------- Helper: Extract GPS metadata ----------
  async function extractMetadata(imagePaths) {
    const results = [];

    try {
      for (const p of imagePaths) {
        try {
          const meta = await exiftool.readRaw(p, ["-n", "-GPSLatitude", "-GPSLongitude"]);
          results.push({ path: p, metadata: meta });
        } catch (err) {
          results.push({
            path: p,
            metadata: { GPSLatitude: null, GPSLongitude: null }
          });
        }
      }
    } finally {
      await exiftool.end();
    }

    return results;
  }

  // ---------- Helper: Extract readable locations ----------
  async function extractLocations(gpsArray) {
    const locations = [];

    for (const item of gpsArray) {
      if (!item.lat || !item.lon) {
        locations.push({
          ...item,
          location: "No GPS metadata"
        });
        continue;
      }

      try {
        const res = await geocoder.reverse({ lat: item.lat, lon: item.lon });
        const g = res[0];

        locations.push({
          ...item,
          location: [g.streetName, g.city, g.county, g.country]
            .filter(Boolean)
            .join(", "),
          extra: g.extra
        });

      } catch (err) {
        locations.push({
          ...item,
          location: "Error retrieving location"
        });
      }
    }

    return locations;
  }

  // -------------------------------------------------------------------
  // RUN PIPELINE
  // -------------------------------------------------------------------
  result.imagesBase64 = convertToBase64(imagePaths);

  const metadataResults = await extractMetadata(imagePaths);
  result.metaData = metadataResults;

  result.gpsArray = metadataResults.map(m => ({
    path: m.path,
    lat: m.metadata.GPSLatitude ?? null,
    lon: m.metadata.GPSLongitude ?? null
  }));

  result.locationsArray = await extractLocations(result.gpsArray);

  // -------------------------------------------------------------------
  // SEND TO GEMINI
  // -------------------------------------------------------------------

  const ai = new GoogleGenerativeAI(process.env.geminiApiKey);
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const parts = [
    { text: "Extract information from these images and metadata." },
    { text: "Only respond with relevant single-word tags from: ['galway','laptop','notes','newyorkcity','desk']." },
    { text: "Here is the metadata:\n" + JSON.stringify(result, null, 2) },
    { text: "Locations:\n" + JSON.stringify(result.locationsArray, null, 2) }
  ];

  // Attach images
  for (const img of result.imagesBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: img.base64
      }
    });
  }

  const psuedoResult = { tags: ["galway", "christmas market" ] };

  try {
  const LLMresult = await model.generateContent({
    contents: [{ role: "user", parts }]
  });

  return LLMresult.response.text();

} catch (err) {
  const code = err?.error?.code;

  if (code === 429 || code === 400) {
    console.warn(`LLM failed with code ${code}. Returning fallback tags.`);
    return psuedoResult;
  }

  // Unknown error → still fallback
  return psuedoResult;
}
}

