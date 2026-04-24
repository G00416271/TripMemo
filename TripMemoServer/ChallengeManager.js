import supabase from "./supabaseClient.js";
import { embedText } from "./clipChallengeEmbed.js";

const SIMILARITY_THRESHOLD = 0.20;
const LOCATION_RADIUS_M = 500;

const CHALLENGE_DEFS = {
  paris_eiffel: {
    label: "Eiffel Tower",
    landmark: { lat: 48.858370, lng: 2.294481 },
    textPrompts: [
      "a photo of the Eiffel Tower in Paris",
      "the Eiffel Tower iron lattice structure",
      "Eiffel Tower from below looking up",
    ],
  },
  paris_arc: {
    label: "Arc de Triomphe",
    landmark: { lat: 48.873792, lng: 2.295028 },
    textPrompts: [
      "a photo of the Arc de Triomphe in Paris",
      "Arc de Triomphe monument at Place Charles de Gaulle",
    ],
  },
  dublin_spire: {
    label: "The Spire",
    landmark: { lat: 53.349862, lng: -6.260179 },
    textPrompts: [
      "a photo of the Spire of Dublin on O'Connell Street",
      "tall stainless steel needle monument Dublin",
      "Monument of Light Dublin city centre",
    ],
  },
  dublin_liffey: {
    label: "River Liffey",
    landmark: { lat: 53.346109, lng: -6.259814 },
    textPrompts: [
      "a photo of the River Liffey in Dublin",
      "Ha'penny Bridge over the River Liffey Dublin",
      "River Liffey with Dublin city quays",
    ],
  },
  london_bigben: {
    label: "Big Ben",
    landmark: { lat: 51.500729, lng: -0.124625 },
    textPrompts: [
      "a photo of Big Ben clock tower in London",
      "Elizabeth Tower Palace of Westminster London",
      "Big Ben and Houses of Parliament",
    ],
  },
  galway_anything: {
    label: "Anything (Test)",
    landmark: { lat: 53.270962, lng: -9.056791 },
    textPrompts: null,
  },
};

let TEXT_VECTORS = null;

export async function initChallengeVectors() {
  TEXT_VECTORS = {};
  for (const [taskId, def] of Object.entries(CHALLENGE_DEFS)) {
    if (!def.textPrompts) {
      TEXT_VECTORS[taskId] = null;
      continue;
    }
    try {
      const vecs = await embedText(def.textPrompts);
      TEXT_VECTORS[taskId] = vecs;
      console.log(`📎 CLIP text vectors ready for ${taskId} (${vecs.length} prompts)`);
    } catch (err) {
      console.error(`❌ Failed to load vectors for ${taskId}:`, err.message);
      TEXT_VECTORS[taskId] = null;
    }
  }
}

function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function bestSimilarity(imageVectors, textVectors) {
  if (!imageVectors || !textVectors) return 0;
  let best = 0;
  for (const iv of imageVectors) {
    for (const tv of textVectors) {
      const s = cosineSimilarity(iv, tv);
      if (s > best) best = s;
    }
  }
  return best;
}

function haversineMetres(a, b) {
  const R = 6_371_000;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// No-op — create the table in Supabase dashboard instead
export async function ensureChallengeTable() {
  return;
}

async function isAlreadyComplete(userId, taskId) {
  const { data, error } = await supabase
    .from("challenge_completions")
    .select("id")
    .eq("user_id", userId)
    .eq("task_id", taskId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

async function saveCompletion(userId, taskId, { similarity, distanceM, latitude, longitude }) {
  const { error } = await supabase
    .from("challenge_completions")
    .upsert({
      user_id: userId,
      task_id: taskId,
      similarity: similarity ?? null,
      distance_m: distanceM ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,task_id" });

  if (error) throw error;
}

export async function getCompletedChallenges(userId) {
  const { data, error } = await supabase
    .from("challenge_completions")
    .select("task_id, completed_at, similarity, distance_m")
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}

export async function validateChallenge({ userId, taskId, imageVectors, location }) {
  if (!TEXT_VECTORS) {
    return { success: false, reason: "server_not_ready", message: "Challenge system is still initialising. Try again in a moment." };
  }

  const challenge = CHALLENGE_DEFS[taskId];
  if (!challenge) {
    return { success: false, reason: "unknown_task", message: "Challenge not found." };
  }

  if (await isAlreadyComplete(userId, taskId)) {
    return { success: false, reason: "already_complete", message: "You have already completed this challenge." };
  }

  if (!location || location.latitude == null || location.longitude == null) {
    return { success: false, reason: "location_missing", message: "Location data is required. Please enable GPS and try again." };
  }

  const distanceM = haversineMetres(
    { lat: location.latitude, lng: location.longitude },
    challenge.landmark
  );

  if (distanceM > LOCATION_RADIUS_M) {
    return {
      success: false,
      reason: "too_far",
      message: `You are ${Math.round(distanceM)}m away from ${challenge.label}. You need to be within ${LOCATION_RADIUS_M}m.`,
      distanceM: Math.round(distanceM),
    };
  }

  let similarity = null;
  const refVectors = TEXT_VECTORS[taskId];

  if (refVectors != null) {
    if (!imageVectors || imageVectors.length === 0) {
      return { success: false, reason: "no_vectors", message: "No image data received." };
    }

    similarity = bestSimilarity(imageVectors, refVectors);
    console.log(`🔍 ${taskId} | similarity: ${similarity.toFixed(4)} | threshold: ${SIMILARITY_THRESHOLD} | dist: ${Math.round(distanceM)}m`);

    if (similarity < SIMILARITY_THRESHOLD) {
      return {
        success: false,
        reason: "wrong_landmark",
        message: `Image doesn't match ${challenge.label} (score: ${similarity.toFixed(2)}, needed ≥ ${SIMILARITY_THRESHOLD}). Try a clearer, closer photo.`,
        similarity: parseFloat(similarity.toFixed(4)),
        distanceM: Math.round(distanceM),
      };
    }
  }

  await saveCompletion(userId, taskId, {
    similarity,
    distanceM,
    latitude: location.latitude,
    longitude: location.longitude,
  });

  console.log(`✅ Challenge complete — user ${userId} | ${taskId} | sim: ${similarity?.toFixed(3) ?? "skipped"} | dist: ${Math.round(distanceM)}m`);

  return {
    success: true,
    message: `🏅 Challenge complete! You photographed ${challenge.label}.`,
    similarity: similarity != null ? parseFloat(similarity.toFixed(4)) : null,
    distanceM: Math.round(distanceM),
  };
}