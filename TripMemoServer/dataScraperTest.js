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
    apiKey: process.env.opencageApiKey,
  });

  // ---------- Convert image to base64 ----------
  const base64 = fs.readFileSync(imagePath, "base64");

  // ---------- Extract EXIF ----------
  let meta = {};
  try {
    meta = await exiftool.readRaw(imagePath, [
      "-n",
      "-GPSLatitude",
      "-GPSLongitude",
    ]);
  } catch (err) {
    meta = { GPSLatitude: null, GPSLongitude: null };
  } finally {
    await exiftool.end();
  }

  const gps = {
    lat: meta.GPSLatitude ?? null,
    lon: meta.GPSLongitude ?? null,
  };

  // ---------- Reverse geocode ----------
  let location = "No GPS metadata";
  if (gps.lat && gps.lon) {
    try {
      const res = await geocoder.reverse({ lat: gps.lat, lon: gps.lon });
      const g = res[0];
      location = [g.streetName, g.city, g.county, g.country]
        .filter(Boolean)
        .join(", ");
    } catch {
      location = "Error retrieving location";
    }
  }

  // ---------- Prepare payload ----------
  const fullInfo = {
    metaData: meta,
    gps,
    location,
  };

  // ---------- Run Gemini ----------
  const ai = new GoogleGenerativeAI(process.env.geminiApiKey);
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const parts = [
    {
      text: "You are tagging an image using only short, relevant labels.",
    },
    {
      text: 'Return ONLY a JSON array of strings in this format: ["tag1","tag2","tag3"].',
    },
    {
      text: "Choose relevant tags based on the image content AND the metadata.",
    },
    {
      text: "Allowed tags: ['galway','laptop','notes','newyorkcity','desk','drawing','black hoodie'].",
    },
    {
      text: "You MAY also include one or two extra obvious items visible in the image (example: 'pen', 'mug').",
    },
    {
      text: "Do NOT include explanations. Do NOT include text outside the JSON array.",
    },
    {
      text: "Here is the metadata:\n" + JSON.stringify(fullInfo, null, 2),
    },
  ];

  parts.push({
    inlineData: {
      mimeType: "image/jpeg",
      data: base64,
    },
  });

  let LLMresult;
try {
  LLMresult = await model.generateContent({
    contents: [{ role: "user", parts }]
  });
} catch (err) {
  console.log("❌ Gemini request failed:", err);
  return { tags: [] };
}

// -----------------------------
// Clean + extract JSON safely
// -----------------------------
let raw = LLMresult.response.text()
  .replace(/```json|```/g, "")
  .replace(/^\s+|\s+$/g, "")   // trim whitespace reliably
  .trim();

let parsedTags = [];

try {
  parsedTags = JSON.parse(raw);
  if (!Array.isArray(parsedTags)) throw new Error("Not an array");
} catch (err) {
  console.log("⚠️ JSON parse failed, raw output:", raw);
  parsedTags = [];
}

// -----------------------------
// Final return
// -----------------------------
return {
  tags: parsedTags
};
}