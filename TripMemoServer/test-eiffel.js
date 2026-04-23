#!/usr/bin/env node
// test-eiffel.js
//
// Downloads real Eiffel Tower photos from Wikimedia Commons and submits them
// to /challenge-submit as if taken on-location in Paris.
//
// Run:
//   node test-eiffel.js
//   $env:TEST_EMAIL="you@example.com"; $env:TEST_PASSWORD="yourpass"; node test-eiffel.js

import FormData from "form-data";

const BASE_URL      = "http://https://tripmemo-11.onrender.com";
const TEST_EMAIL    = process.env.TEST_EMAIL    ?? "tim@example.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "kingofthepirates";

// Three real Eiffel Tower photos — public domain / CC, Wikimedia Commons
// Using multiple angles gives CLIP the best chance of a high similarity score
const EIFFEL_PHOTOS = [
  {
    label: "from below looking up",
    url:   "https://media.cnn.com/api/v1/images/stellar/prod/170801114832-eiffel-tower-guide-base.jpg?q=w_2187,h_1458,x_0,y_0,c_fill",
  },
  {
    label: "full tower vertical",
    url:   "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg",
  },
  {
    label: "classic tourist shot",
    url:   "https://www.jasminealley.com/wp-content/uploads/2019/07/trocadero-sloped-wall-with-eiffel-tower-view-1440x1798.jpg",
  },
];

// Spoof GPS — standing right at the Eiffel Tower base
const PARIS_LOCATION = {
  latitude:  48.858370,
  longitude: 2.294481,
  accuracy:  8,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function login() {
  const res = await fetch(`${BASE_URL}/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({ email: TEST_EMAIL, password: TEST_PASSWORD }).toString(),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const cookie = res.headers.get("set-cookie")?.match(/session=([^;]+)/)?.[1];
  if (!cookie) throw new Error("No session cookie returned");
  const user = await res.json();
  console.log(`🔐 Logged in as ${user.username} (id ${user.user_id})\n`);
  return `session=${cookie}`;
}

async function downloadImage(url, label) {
  process.stdout.write(`   📥 Downloading "${label}"... `);
  const res = await fetch(url, {
    headers: { "User-Agent": "TripMemo-Test/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`${(buf.length / 1024).toFixed(0)} KB ✓`);
  return buf;
}

async function submitChallenge(sessionCookie, taskId, imageBuffers) {
  const form = new FormData();
  form.append("taskId",     taskId);
  form.append("clipHint",   "a photo of the Eiffel Tower in Paris");
  form.append("capturedAt", new Date().toISOString());
  form.append("location",   JSON.stringify(PARIS_LOCATION));

  imageBuffers.forEach((buf, i) => {
    form.append("images", buf, {
      filename:    `eiffel_${i}.jpg`,
      contentType: "image/jpeg",
    });
  });

  const res = await fetch(`${BASE_URL}/challenge-submit`, {
    method:  "POST",
    headers: { Cookie: sessionCookie, ...form.getHeaders() },
    body:    form.getBuffer(),
  });

  return { status: res.status, body: await res.json() };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log("🗼  Eiffel Tower — Real Image Test");
  console.log("─".repeat(50));

  // Login
  const sessionCookie = await login();

  // Download all photos
  console.log("Fetching Eiffel Tower photos:\n");
  const buffers = [];
  for (const photo of EIFFEL_PHOTOS) {
    try {
      const buf = await downloadImage(photo.url, photo.label);
      buffers.push(buf);
    } catch (err) {
      console.warn(`   ⚠️  Skipping "${photo.label}": ${err.message}`);
    }
  }

  if (buffers.length === 0) {
    console.error("\n❌ All image downloads failed. Check your internet connection.");
    process.exit(1);
  }

  console.log(`\n📤 Submitting ${buffers.length} photo(s) with Paris GPS coords...\n`);
  const { status, body } = await submitChallenge(sessionCookie, "paris_eiffel", buffers);

  // ── Results ──────────────────────────────────────────────────────────────
  console.log("─".repeat(50));
  console.log(`HTTP status:  ${status}`);
  console.log(`Success:      ${body.success}`);
  console.log(`Message:      ${body.message}`);

  if (body.similarity != null) {
    const pct = (body.similarity * 100).toFixed(1);
    const bar = "█".repeat(Math.round(body.similarity * 40)).padEnd(40, "░");
    console.log(`\nSimilarity:   ${body.similarity} (${pct}%)`);
    console.log(`              [${bar}]`);
    console.log(`Threshold:    0.20 (20%)`);
  }

  if (body.distanceM != null) {
    console.log(`Distance:     ${body.distanceM}m from landmark`);
  }

  console.log("\n─".repeat(50));

  if (body.success) {
    console.log("✅  PASSED — Eiffel Tower recognised");

  } else if (body.reason === "already_complete") {
    console.log("⚠️   Already completed — reset with:");
    console.log("    DELETE FROM challenge_completions WHERE task_id = 'paris_eiffel';");

  } else if (body.reason === "wrong_landmark") {
    console.log("❌  FAILED — similarity too low");
    console.log("\n    What to try:");
    console.log("    1. Check server console for the 🔍 similarity line to see the actual score");
    console.log("    2. Lower SIMILARITY_THRESHOLD in ChallengeManager.js (currently 0.20)");
    console.log("    3. The downloaded image may have been redirected — save an Eiffel Tower");
    console.log("       JPEG manually and load it with fs.readFileSync('./eiffel.jpg')");

  } else {
    console.log(`❌  FAILED — ${body.reason}: ${body.message}`);
  }
})();



