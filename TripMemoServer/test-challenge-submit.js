#!/usr/bin/env node
// test-challenge-submit.js
//
// Simulates challenge submissions without needing to be physically present.
// Run with:  node test-challenge-submit.js
//
// Requires:  npm install node-fetch form-data  (or just use Node 18+ native fetch)

import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = "http://localhost:5000";

// ─── Fake GPS coordinates (one per landmark) ──────────────────────────────────
const LOCATIONS = {
  paris_eiffel:    { latitude: 48.858370, longitude: 2.294481,   accuracy: 12 },
  paris_arc:       { latitude: 48.873792, longitude: 2.295028,   accuracy: 15 },
  dublin_spire:    { latitude: 53.349862, longitude: -6.260179,  accuracy: 10 },
  dublin_liffey:   { latitude: 53.346109, longitude: -6.259814,  accuracy: 18 },
  london_bigben:   { latitude: 51.500729, longitude: -0.124625,  accuracy: 9  },
  galway_anything: { latitude: 53.270962, longitude: -9.056791,  accuracy: 20 },
};

const CLIP_HINTS = {
  paris_eiffel:    "a photo of the Eiffel Tower in Paris",
  paris_arc:       "a photo of the Arc de Triomphe in Paris",
  dublin_spire:    "a photo of the Spire monument in Dublin",
  dublin_liffey:   "a photo of the River Liffey in Dublin",
  london_bigben:   "a photo of Big Ben clock tower in London",
  galway_anything: "a photo of anything",
};

// ─── Tiny 1×1 red JPEG (valid image bytes, no camera needed) ─────────────────
// Generated with: python3 -c "import base64; ..."
const DUMMY_JPEG_B64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U" +
  "HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN" +
  "DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy" +
  "MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIRAAAg" +
  "ICAgMBAAAAAAAAAAAAAQIDBAUREiExQf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEA" +
  "AAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwM47dFbRJKVr3XyN1v0pPIAAAAAAAAAA" +
  "AAAAAAB//9k=";

function dummyJpegBuffer() {
  return Buffer.from(DUMMY_JPEG_B64, "base64");
}

// ─── Login helper (gets a session cookie) ─────────────────────────────────────
async function login(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({ email, password }).toString(),
  });

  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);

  // Grab the Set-Cookie header so we can replay it
  const cookie = res.headers.get("set-cookie");
  if (!cookie) throw new Error("No session cookie returned from /login");

  const sessionMatch = cookie.match(/session=([^;]+)/);
  if (!sessionMatch) throw new Error("Could not parse session cookie");

  const user = await res.json();
  console.log(`🔐 Logged in as user_id=${user.user_id} (${user.username})`);
  return { cookie: `session=${sessionMatch[1]}`, user };
}

// ─── Submit a challenge ───────────────────────────────────────────────────────
async function submitChallenge(taskId, sessionCookie, opts = {}) {
  const location  = opts.location  ?? LOCATIONS[taskId];
  const clipHint  = opts.clipHint  ?? CLIP_HINTS[taskId];
  const photoCount = opts.photoCount ?? 1;

  const form = new FormData();
  form.append("taskId",     taskId);
  form.append("clipHint",   clipHint);
  form.append("capturedAt", new Date().toISOString());
  form.append("location",   JSON.stringify(location));

  // Attach N dummy JPEG blobs
  for (let i = 0; i < photoCount; i++) {
    form.append("images", dummyJpegBuffer(), {
      filename:    `photo_${i}.jpg`,
      contentType: "image/jpeg",
    });
  }

  const res = await fetch(`${BASE_URL}/challenge-submit`, {
    method:  "POST",
    headers: {
      Cookie: sessionCookie,
      ...form.getHeaders(),   // includes correct Content-Type: multipart/form-data; boundary=...
    },
    body: form.getBuffer(),   // form-data package buffer, not the object itself
  });

  const json = await res.json();
  return { status: res.status, body: json };
}

// ─── Test suite ───────────────────────────────────────────────────────────────
async function runTests(sessionCookie) {
  const results = [];

  async function test(name, fn) {
    try {
      const r = await fn();
      const pass = r.status === 200 && r.body.success;
      results.push({ name, pass, status: r.status, body: r.body });
      console.log(
        `${pass ? "✅" : "❌"} [${r.status}] ${name}`,
        pass ? `— ${r.body.message}` : `— reason: ${r.body.reason ?? "?"} | ${r.body.message ?? ""}`
      );
    } catch (err) {
      results.push({ name, pass: false, error: err.message });
      console.log(`💥 ${name} — threw: ${err.message}`);
    }
  }

  // ── Happy paths ───────────────────────────────────────────────────────────
  await test("galway_anything — location OK, no vector check",
    () => submitChallenge("galway_anything", sessionCookie));

  // ── Duplicate completion ───────────────────────────────────────────────────
  await test("galway_anything — second attempt should fail (already_complete)",
    async () => {
      const r = await submitChallenge("galway_anything", sessionCookie);
      // We expect already_complete here, but server returns 422 not 200
      return { status: r.status, body: r.body };
    });

  // ── Wrong location ────────────────────────────────────────────────────────
  await test("paris_eiffel — submitted from Dublin coords (too_far)",
    () => submitChallenge("paris_eiffel", sessionCookie, {
      location: LOCATIONS.dublin_spire,   // wrong city
    }));

  // ── Missing location ─────────────────────────────────────────────────────
  await test("paris_arc — null location (location_missing)",
    () => submitChallenge("paris_arc", sessionCookie, {
      location: null,
    }));

  // ── Unknown task ID ───────────────────────────────────────────────────────
  await test("nonexistent_task — unknown_task",
    () => submitChallenge("fake_task_xyz", sessionCookie, {
      location: LOCATIONS.dublin_spire,
    }));

  // ── Correct Paris location (will still fail vector check unless threshold met) ─
  await test("paris_eiffel — correct coords (may fail vector check)",
    () => submitChallenge("paris_eiffel", sessionCookie, {
      location: LOCATIONS.paris_eiffel,
    }));

  await test("paris_arc — correct coords (may fail vector check)",
    () => submitChallenge("paris_arc", sessionCookie, {
      location: LOCATIONS.paris_arc,
    }));

  await test("dublin_spire — correct coords (may fail vector check)",
    () => submitChallenge("dublin_spire", sessionCookie, {
      location: LOCATIONS.dublin_spire,
    }));

  await test("dublin_liffey — correct coords (may fail vector check)",
    () => submitChallenge("dublin_liffey", sessionCookie, {
      location: LOCATIONS.dublin_liffey,
    }));

  await test("london_bigben — correct coords (may fail vector check)",
    () => submitChallenge("london_bigben", sessionCookie, {
      location: LOCATIONS.london_bigben,
    }));

  // ── Summary ───────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.pass).length;
  console.log(`\n📊 ${passed}/${results.length} tests passed`);
  console.log("─".repeat(50));
  console.log("NOTE: Vector-check failures on real landmarks are expected");
  console.log("      until you populate refVectors in ChallengeManager.js");
}

// ─── Entry point ──────────────────────────────────────────────────────────────
(async () => {
  // ⬇️  Change these to a real test account in your DB
  const TEST_EMAIL    = process.env.TEST_EMAIL    ?? "test@example.com";
  const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "password123";

  console.log("🧪 Challenge Submit — Test Runner");
  console.log("─".repeat(50));

  let sessionCookie;
  try {
    const auth = await login(TEST_EMAIL, TEST_PASSWORD);
    sessionCookie = auth.cookie;
  } catch (err) {
    console.error("❌ Could not log in:", err.message);
    console.error("   Set TEST_EMAIL and TEST_PASSWORD env vars to a valid account.");
    process.exit(1);
  }

  await runTests(sessionCookie);
})();