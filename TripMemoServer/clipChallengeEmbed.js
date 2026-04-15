// clipChallengeEmbed.js
//
// Node ↔ Python bridge for CLIP embeddings used in challenge validation.
// Calls clipChallenge.py via stdin/stdout.
//
// Exports:
//   embedImages(files)   — multer file objects → 512-dim vectors
//   embedText(prompts)   — string[]            → 512-dim vectors

import { spawn } from "child_process";

const PYTHON = process.env.PYTHON_PATH ?? "python";

// ─── Shared spawn helper ───────────────────────────────────────────────────────
function callPython(payload) {
  return new Promise((resolve, reject) => {
    const py   = spawn(PYTHON, ["clipChallenge.py"]);
    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (c) => (stdout += c));
    py.stderr.on("data", (c) => (stderr += c));

    py.on("close", (code) => {
      if (stderr) console.warn("[clipChallengeEmbed] python stderr:", stderr.trim());
      if (code !== 0) return reject(new Error(`clipChallenge.py exited ${code}: ${stderr.trim()}`));
      try {
        const result = JSON.parse(stdout.trim());
        if (!Array.isArray(result)) throw new Error("Expected JSON array");
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse CLIP output: ${err.message}\nRaw: ${stdout.slice(0, 300)}`));
      }
    });

    py.on("error", (err) => reject(new Error(`Could not start Python: ${err.message}`)));

    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();
  });
}

// ─── Image embedding ──────────────────────────────────────────────────────────
export async function embedImages(files) {
  if (!files || files.length === 0) return [];
  const payload = {
    mode:   "images",
    images: files.map((f, i) => ({
      name: f.originalname ?? f.name ?? `image_${i}.jpg`,
      data: (f.buffer ?? f.data).toString("base64"),
    })),
  };
  return callPython(payload);
}

// ─── Text embedding ───────────────────────────────────────────────────────────
export async function embedText(prompts) {
  if (!prompts || prompts.length === 0) return [];
  const payload = { mode: "text", texts: prompts };
  return callPython(payload);
}
