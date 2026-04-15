import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { exiftool } from "exiftool-vendored";
import NodeGeocoder from "node-geocoder";
import fs from "fs";
import sharp from "sharp";
import heicConvert from "heic-convert";
// import * as locationWords from "./words.json";

// ---------------------------------------------
// MASTER FUNCTION
// ---------------------------------------------
export default async function processImages(imagePaths) {

  //HEIC to Jpeg Conversion
  async function convertHEICBuffer(filePath) {
    const input = fs.readFileSync(filePath);

    try {
      const output = await heicConvert({
        buffer: input,
        format: "JPEG",
        quality: 0.6,
      });
      console.log ("HEIC Conversion ran and successful")
      return output.toString("base64");

    } catch (e) {
      console.log("heic-convert error:", e);
      return null;
    }
  }

  // ---------- Setup geocoder ----------
  const geocoder = NodeGeocoder({   //using location from metadata the location of the picture can be found 
    provider: "opencage",
    apiKey: process.env.opencageApiKey,
  });

  const result = {
    imagesBase64: [],
    metaData: [],
    gpsArray: [],
    locationsArray: [],
  };

  async function compressImage(filePath) {
    if (filePath.toLowerCase().endsWith(".heic")) {
      const b64 = await convertHEICBuffer(filePath);
      if (b64) return b64;
    }

    try {
      const buffer = await sharp(filePath)
        .rotate()
        .jpeg({ quality: 70 })
        .toBuffer();

      return buffer.toString("base64");
    } catch (err) {
      console.log("Compression error:", err);
      return fs.readFileSync(filePath, "base64");
    }
  }

  // ---------- Convert to base64 ----------
  async function convertToBase64(paths) {
    const out = [];

    for (const p of paths) {
      const base64 = await compressImage(p);
      out.push({ path: p, base64 });
    }

    return out;
  }

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
            .join(", "),
        });
      } catch {
        locations.push({ ...item, location: "Error retrieving location" });
      }
    }

    return locations;
  }

  // ---------- PIPELINE ----------
  result.imagesBase64 = await convertToBase64(imagePaths);

  const metadataResults = await extractMetadata(imagePaths);
  result.metaData = metadataResults;

  result.gpsArray = metadataResults.map((m) => ({
    path: m.path,
    lat: m.metadata.GPSLatitude ?? null,
    lon: m.metadata.GPSLongitude ?? null,
  }));

  result.locationsArray = await extractLocations(result.gpsArray);

  const locationTags = [];

  for (const item of result.locationsArray) {
    const loc = item.location?.toLowerCase() || "";

    for (const key in locationWords) {
      if (loc.includes(key)) {
        locationTags.push({
          name: key,
          words: locationWords[key],
        });
        // push the whole array
      }
    }
  }

  // ---------- SEND TO Openai ----------
  const ai = new OpenAI({
    apiKey: process.env.TripMemoOpenAiKey,
  });

  //const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const parts = [
    {
      text: "Analyze the provided images and metadata to extract relevant tags.",
    },
    {
      text: `Return ONLY a valid JSON array of lowercase strings. Example: ["galway","christmas market","volleyball","black hoodie"]`,
    },
    {
      text: "Extract tags for: visible objects, clothing, people, activities, landmarks, locations, events, weather conditions, and time of day.",
    },
    {
      text:
        "IMPORTANT: Given these GPS locations: " +
        JSON.stringify(result.locationsArray, null, 2) +
        "\nIdentify the city, county, region, and country from these coordinates. Include tags for: the location name itself, nearby landmarks, businesses, neighborhoods, or points of interest within ~500m. if there is no loctation data, return the word 'Anomaly'.",
    },
    {
      text:
        "Prioritize tags from this predefined list when applicable: " +
        JSON.stringify(locationTags.map((x) => x.words).flat(), null, 2),
    },
    {
      text: "Also include additional highly relevant tags you identify with confidence, even if not in the predefined list.",
    },
    {
      text: "Rules:\n- Use lowercase only\n- Prefer specific terms over generic ones (e.g., 'galway' over 'city')\n- Use single words or short phrases (max 3 words)\n- No explanations, preamble, or markdown\n- Output must be valid JSON array only",
    },
  ];

  // attach images
  for (const img of result.imagesBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: img.base64,
      },
    });
  }

  const HI = "WRITE ME A 4 LINE ROMANTIC POEM";

  let LLMresult;

  try {
    LLMresult = await ai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: HI }],
      temperature: 0.2,
    });
  } catch (err) {
    console.log("❌ openai request failed:", err);
    return {
      tags: ["galway christmas market", "galway", "cake", "volleyball"],
    };
  }

  // -----------------------------
  // Clean + extract JSON safely
  // -----------------------------
  let raw = LLMresult.response
    .text()
    .replace(/```json|```/g, "")
    .replace(/^\s+|\s+$/g, "") // trim whitespace reliably
    .trim();

  let parsedTags = [];

  try {
    parsedTags = JSON.parse(raw);
    //if (!Array.isArray(parsedTags)) throw new Error("Not an array");
  } catch (err) {
    //console.log("⚠️ JSON parse failed, raw output:", raw);
    parsedTags = ["galway christmas market", "galway", "cake", "volleyball"];
  }

  // -----------------------------
  // Final return
  // -----------------------------
  return {
    tags: parsedTags,
    locations: result.locationsArray,
    //tags : ['galway christmas market', 'galway', 'cake', 'volleyball'],
  };
}
//processImages(["./images/IMG_3941.HEIC"]).then(console.log);
