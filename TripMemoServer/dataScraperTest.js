import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import { exiftool } from "exiftool-vendored";
import NodeGeocoder from "node-geocoder";
import fs from "fs";
import path from "path";
import e from "express";

// ------------------------------------------------------
// STANDALONE FUNCTION: processSingleImage(imagePath)
// ------------------------------------------------------
export default async function processSingleImage(imagePath) {

  // ---------- Setup geocoder ----------
  const geocoder = NodeGeocoder({
    provider: "opencage",
    apiKey: process.env.opencageApiKey
  });

  // ---------- Convert image to base64 ----------
  const base64 = fs.readFileSync(imagePath, "base64");

  // ---------- Extract EXIF ----------
  let meta = {};
  try {
    meta = await exiftool.readRaw(imagePath, ["-n", "-GPSLatitude", "-GPSLongitude"]);
  } catch (err) {
    meta = { GPSLatitude: null, GPSLongitude: null };
  } finally {
    await exiftool.end();
  }

  const gps = {
    lat: meta.GPSLatitude ?? null,
    lon: meta.GPSLongitude ?? null
  };

  // ---------- Reverse geocode ----------
  let location = "No GPS metadata";
  if (gps.lat && gps.lon) {
    try {
      const res = await geocoder.reverse({ lat: gps.lat, lon: gps.lon });
      const g = res[0];
      location = [g.streetName, g.city, g.county, g.country].filter(Boolean).join(", ");
    } catch {
      location = "Error retrieving location";
    }
  }

  // ---------- Prepare payload ----------
  const fullInfo = {
    metaData: meta,
    gps,
    location
  };

  // ---------- Run Gemini ----------
  const ai = new GoogleGenerativeAI(process.env.geminiApiKey);
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const parts = [
   { text: "Extract information from this image and metadata." },
  { text: "Respond ONLY with a JSON array of strings in this exact format: [\"galway\",\"christmas market\",\"volleyball\"]" },
  { text: "Choose only relevant single-word or short tags from: ['galway','laptop','notes','newyorkcity','desk','drawing','black hoodie']." 
  },
  { text: "Do not include explanations. Output only the array." },
  { text: "Metadata:\n" + JSON.stringify(fullInfo, null, 2) }
  ];

  parts.push({
    inlineData: {
      mimeType: "image/jpeg",
      data: base64
    }
  });

    const LLMresult = await model.generateContent({
      contents: [{ role: "user", parts }]
    });

    console.log (LLMresult.response.text());
}

// ------------------------------------------------------
// Example usage:
// ------------------------------------------------------
 processSingleImage("./IMG_3949.HEIC");
