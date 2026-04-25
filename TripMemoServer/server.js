import "dotenv/config";

import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import crypto from "crypto";

import { uploadToR2, generateSignedUrl } from "./r2.js";
import getInterests from "./InterestReq.js";
import getNodes from "./neoDB.js";
import getMemories from "./MemoriesReq.js";
import { neoConnectTest } from "./neoConnectTest.js";
import login, { register } from "./login-register.js";
import requireAuth from "./auth.js";
import supabase from "./supabaseClient.js";
import { clipAnalyse } from "./clipAnalyse.js";
import stage from "./imageStaging.js";
import canvasDbRoutes from "./canvasDbRoutes.js";
import canvasShareRoutes from "./canvasShareRoutes.js";
import { embedImages } from "./clipChallengeEmbed.js";
import {
  validateChallenge,
  getCompletedChallenges,
  ensureChallengeTable,
  initChallengeVectors,
} from "./ChallengeManager.js";

import connectMongoDB from "./mongoDB.js";
import Message from "./models/Message.js";
import GroupMessage from "./models/GroupMessage.js";

ensureChallengeTable().catch(console.error);
initChallengeVectors().catch(console.error);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "500mb" }));
app.use(bodyParser.json({ limit: "500mb" }));
app.use("/api/canvas", canvasDbRoutes);
app.use("/api/canvas", canvasShareRoutes);

app.use("/icons", express.static(path.join(__dirname, "Icons")));

app.get("/icons", (req, res) => {
  res.json({ message: "Icons are available at /icons/<filename>.svg" });
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// ── process images ──────────────────────────────────────
app.post("/process-images", upload.array("files"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const stagedImages = await stage(req.files);
    if (!stagedImages || stagedImages.length === 0) {
      return res.status(400).json({ error: "No images were staged" });
    }

    const payload = stagedImages.map((img, i) => ({
      name: req.files[i]?.originalname || `image_${i}.jpg`,
      data: img.buffer.toString("base64"),
    }));

    const clipAnalysis = await clipAnalyse(payload);
    return res.json(clipAnalysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Processing failed" });
  }
});

app.get("/debug-tags", async (req, res) => {
  const { data, error } = await supabase
    .from("memories")
    .select("tags")
    .eq("memory_id", Number(req.query.memoryId))
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? null);
});

app.post("/interestReq", upload.none(), async (req, res) => {
  try {
    const tags = Array.isArray(req.body?.tags) ? req.body.tags : [];
    const result = await getInterests(tags, req.body);
    res.json(result);
  } catch (err) {
    console.error("Error in /interestReq route:", err);
    res.status(500).json({ error: "Processing failed" });
  }
});

// ── LOGIN ───────────────────────────────────────────────
app.post("/login", upload.none(), async (req, res) => {
  const { email, username, password } = req.body;
  if (!password || (!username && !email)) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const user = await login(email, username, password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.cookie("session", user.user_id, {
    httpOnly: true,
    sameSite: "none", //was previously lax
    secure: true, //was previously false
    maxAge: 86400000,
  });
  return res.status(200).json(user);
});

// ── USER SEARCH ─────────────────────────────────────────
app.get("/users/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const requestingUserId = req.cookies?.session;

    const { data, error } = await supabase
      .from("users")
      .select("user_id, username, first_name, last_name, avatar_url")
      .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .neq("user_id", requestingUserId)
      .limit(10);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("🔥 /users/search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// ── FRIEND REQUEST ──────────────────────────────────────
app.post("/users/friend-request/:id", async (req, res) => {
  try {
    const { senderId } = req.body;
    const receiverId = req.params.id;

    const { error } = await supabase
      .from("friends")
      .upsert(
        { user_id: senderId, friend_id: receiverId, status: "pending" },
        { onConflict: "user_id,friend_id", ignoreDuplicates: true }
      );

    if (error) throw error;
    res.json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Friend request error:", error);
    res.status(500).json({ error: "Failed to send request" });
  }
});

app.post("/users/friend-request/:id/accept", async (req, res) => {
  try {
    const { userId } = req.body;
    const senderId = req.params.id;

    await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("user_id", senderId)
      .eq("friend_id", userId);

    await supabase
      .from("friends")
      .upsert(
        { user_id: userId, friend_id: senderId, status: "accepted" },
        { onConflict: "user_id,friend_id" }
      );

    res.json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Accept error:", error);
    res.status(500).json({ error: "Failed to accept request" });
  }
});

app.post("/users/friend-request/:id/decline", async (req, res) => {
  try {
    const { userId } = req.body;
    const senderId = req.params.id;

    await supabase
      .from("friends")
      .delete()
      .eq("user_id", senderId)
      .eq("friend_id", userId);

    res.json({ message: "Friend request declined" });
  } catch (error) {
    res.status(500).json({ error: "Failed to decline request" });
  }
});

// ── FRIENDS & REQUESTS LISTS ────────────────────────────
app.get("/users/:id/friends", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("friends")
      .select("friend_id, users!friends_friend_id_fkey(user_id, username, first_name, last_name, avatar_url)")
      .eq("user_id", req.params.id)
      .eq("status", "accepted");

    if (error) throw error;
    res.json(data.map((row) => row.users));
  } catch (error) {
    console.error("friends error:", error);
    res.status(500).json({ error: "Failed to get friends" });
  }
});

app.get("/users/:id/friend-requests", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("friends")
      .select("user_id, users!friends_user_id_fkey(user_id, username, first_name, last_name, avatar_url)")
      .eq("friend_id", req.params.id)
      .eq("status", "pending");

    if (error) throw error;
    res.json(data.map((row) => row.users));
  } catch (error) {
    console.error("friend requests error:", error);
    res.status(500).json({ error: "Failed to get requests" });
  }
});

// ── MESSAGES (MongoDB) ──────────────────────────────────
app.post("/messages", async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;
    const message = new Message({ senderId, receiverId, text });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/messages/:userId/:friendId", async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// ── REGISTER ────────────────────────────────────────────
app.post("/register", async (req, res) => {
  const { username, firstName, lastName, email, password } = req.body;
  if (!password || (!username && !email)) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const user = await register(username, firstName, lastName, email, password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.cookie("session", user.user_id, {
    httpOnly: true,
    sameSite: "none", //was previously lax
    secure: true, //was previously false
    maxAge: 86400000,
  });
  return res.status(201).json(user);
});

app.get("/me", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, username, email, first_name, last_name, avatar_url, created_at")
    .eq("user_id", req.userId)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/logout", (req, res) => {
  res.clearCookie("session", { httpOnly: true, sameSite: "none", secure: true }); //was previosly lax and false
  res.sendStatus(200);
});

// ── MEMORIES ────────────────────────────────────────────
app.post("/memories", upload.none(), async (req, res) => {
  try {
    const result = await getMemories(req.body);
    res.json(result ?? { ok: true });
  } catch (err) {
    console.error("Error in /memories route:", err);
    res.status(500).json({ error: "Processing failed" });
  }
});

app.get("/memories/explore", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("memories")
      .select("memory_id, title, created_at, privacy_level, user_id, users(username, first_name, last_name, avatar_url)")
      .eq("privacy_level", "public")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    // Flatten joined user fields
    const rows = data.map((m) => ({
      memory_id: m.memory_id,
      title: m.title,
      created_at: m.created_at,
      privacy_level: m.privacy_level,
      user_id: m.user_id,
      username: m.users?.username,
      first_name: m.users?.first_name,
      last_name: m.users?.last_name,
      avatar_url: m.users?.avatar_url,
    }));
    res.json(rows);
  } catch (error) {
    console.error("Explore error:", error);
    res.status(500).json({ error: "Failed to fetch public memories" });
  }
});

// ── CHALLENGES ──────────────────────────────────────────
app.post("/challenge-submit", requireAuth, upload.array("images"), async (req, res) => {
  try {
    const taskId = req.body.taskId;
    const location = req.body.location ? JSON.parse(req.body.location) : null;
    const imageVectors = await embedImages(req.files ?? []);

    const result = await validateChallenge({
      userId: req.userId,
      taskId,
      imageVectors,
      location,
    });

    res.status(result.success ? 200 : 422).json(result);
  } catch (err) {
    console.error("challenge-submit error:", err);
    res.status(500).json({ success: false, reason: "server_error", message: "Server error. Please try again." });
  }
});

app.get("/challenge-completions", requireAuth, async (req, res) => {
  res.json(await getCompletedChallenges(req.userId));
});

app.get("/challenges/completed", requireAuth, async (req, res) => {
  res.json(await getCompletedChallenges(req.userId));
});

// ── DEEZER ──────────────────────────────────────────────
app.get("/api/deezer/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Missing query" });
    const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}`);
    const data = await response.json();
    const cleaned = (data.data || []).map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist.name,
      cover: track.album.cover_big,
      preview: track.preview,
    }));
    res.json(cleaned);
  } catch (err) {
    res.status(500).json({ error: "Deezer fetch failed" });
  }
});

// ── IMAGE PROXY ─────────────────────────────────────────
app.get("/api/image-proxy", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return res.status(400).send("Invalid or missing URL");
    }
    const response = await fetch(url);
    if (!response.ok) return res.status(500).send("Failed to fetch image");
    const buffer = await response.arrayBuffer();
    res.set("Content-Type", response.headers.get("content-type") || "image/jpeg");
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).send("Proxy error");
  }
});

app.get("/ping", (req, res) => res.send("pong"));

app.get("/neoping", async (req, res) => {
  const result = await neoConnectTest();
  res.json(result);
});

// ── SOS CONTACTS ────────────────────────────────────────
app.get("/sos-contacts/:userId", async (req, res) => {
  try {
    const { data: contacts, error } = await supabase
      .from("sos_contacts")
      .select("friend_id")
      .eq("user_id", req.params.userId);

    if (error) throw error;
    if (!contacts || contacts.length === 0) return res.json([]);

    const friendIds = contacts.map((c) => c.friend_id);

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("user_id, username, first_name, last_name")
      .in("user_id", friendIds);

    if (usersError) throw usersError;
    res.json(users);
  } catch (error) {
    console.error("Get SOS contacts error:", error);
    res.status(500).json({ error: "Failed to get SOS contacts" });
  }
});

app.post("/sos-contacts", async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    await supabase
      .from("sos_contacts")
      .upsert({ user_id: userId, friend_id: friendId }, { onConflict: "user_id,friend_id", ignoreDuplicates: true });
    res.json({ message: "SOS contact added" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add SOS contact" });
  }
});

app.delete("/sos-contacts/:userId/:friendId", async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    await supabase.from("sos_contacts").delete().eq("user_id", userId).eq("friend_id", friendId);
    res.json({ message: "SOS contact removed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove SOS contact" });
  }
});

// ── BUCKET LISTS ────────────────────────────────────────
app.get("/bucket-lists/:id/items", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bucket_list_items")
      .select("*")
      .eq("bucket_list_id", req.params.id)
      .order("position");
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to get items" });
  }
});

app.post("/bucket-lists/:id/items", async (req, res) => {
  try {
    const { type, content, position } = req.body;
    const { data, error } = await supabase
      .from("bucket_list_items")
      .insert({
        id: crypto.randomUUID(),
        bucket_list_id: req.params.id,
        type,
        content,
        position: position || 0,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to add item" });
  }
});

app.patch("/bucket-lists/:id/accessed", async (req, res) => {
  try {
    await supabase
      .from("bucket_lists")
      .update({ last_accessed: new Date().toISOString() })
      .eq("id", req.params.id);
    res.json({ message: "Last accessed updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update last accessed" });
  }
});

app.delete("/bucket-lists/items/:itemId", async (req, res) => {
  try {
    await supabase.from("bucket_list_items").delete().eq("id", req.params.itemId);
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

app.patch("/bucket-lists/items/:itemId", async (req, res) => {
  try {
    const { content } = req.body;
    await supabase.from("bucket_list_items").update({ content }).eq("id", req.params.itemId);
    res.json({ message: "Item updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

app.patch("/bucket-lists/items/:itemId/check", async (req, res) => {
  try {
    const { checked } = req.body;
    await supabase.from("bucket_list_items").update({ checked }).eq("id", req.params.itemId);
    res.json({ message: "Item checked" });
  } catch (error) {
    res.status(500).json({ error: "Failed to check item" });
  }
});

app.get("/bucket-lists/:userId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bucket_lists")
      .select("*")
      .eq("user_id", req.params.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to get bucket lists" });
  }
});

app.post("/bucket-lists", async (req, res) => {
  try {
    const { userId, title } = req.body;
    const { data, error } = await supabase
      .from("bucket_lists")
      .insert({ id: crypto.randomUUID(), user_id: userId, title })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to create bucket list" });
  }
});

app.patch("/bucket-lists/:id", async (req, res) => {
  try {
    await supabase.from("bucket_lists").update({ title: req.body.title }).eq("id", req.params.id);
    res.json({ message: "Bucket list renamed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to rename bucket list" });
  }
});

app.delete("/bucket-lists/:id", async (req, res) => {
  try {
    await supabase.from("bucket_lists").delete().eq("id", req.params.id);
    res.json({ message: "Bucket list deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete bucket list" });
  }
});

// ── SAVED PLACES ────────────────────────────────────────
app.get("/saved-places/:userId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("saved_places")
      .select("*")
      .eq("user_id", req.params.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to get saved places" });
  }
});

app.post("/saved-places", async (req, res) => {
  try {
    const { userId, name, latitude, longitude } = req.body;
    const { data, error } = await supabase
      .from("saved_places")
      .insert({ id: crypto.randomUUID(), user_id: userId, name, latitude, longitude })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to save place" });
  }
});

app.delete("/saved-places/:id", async (req, res) => {
  try {
    await supabase.from("saved_places").delete().eq("id", req.params.id);
    res.json({ message: "Place deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete place" });
  }
});

// ── USER PROFILE ────────────────────────────────────────
app.patch("/users/:userId/avatar", async (req, res) => {
  try {
    await supabase.from("users").update({ avatar_url: req.body.avatarUrl }).eq("user_id", req.params.userId);
    res.json({ message: "Avatar updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update avatar" });
  }
});

app.patch("/users/:userId/profile", async (req, res) => {
  try {
    const { firstName, lastName, username } = req.body;

    const { data: existing } = await supabase
      .from("users")
      .select("user_id")
      .eq("username", username)
      .neq("user_id", req.params.userId);

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    await supabase
      .from("users")
      .update({ first_name: firstName, last_name: lastName, username })
      .eq("user_id", req.params.userId);

    res.json({ message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ── GROUPS ──────────────────────────────────────────────
const GROUP_COLOURS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"];

app.post("/groups", async (req, res) => {
  try {
    const { name, createdBy, memberIds } = req.body;
    if (memberIds.length > 7) return res.status(400).json({ error: "Max 8 members including yourself" });

    const groupId = crypto.randomUUID();

    const { data: group, error: groupErr } = await supabase
      .from("group_chats")
      .insert({ id: groupId, name, created_by: createdBy })
      .select()
      .single();
    if (groupErr) throw groupErr;

    const allMembers = [createdBy, ...memberIds];
    const rows = allMembers.map((uid, i) => ({
      id: crypto.randomUUID(),
      group_id: groupId,
      user_id: uid,
      colour: GROUP_COLOURS[i % GROUP_COLOURS.length],
    }));
    const { error: membErr } = await supabase.from("group_members").insert(rows);
    if (membErr) throw membErr;

    await GroupMessage.create({ groupId, senderId: "system", senderName: "system", text: "Group created", type: "system" });

    res.status(201).json(group);
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
});

app.get("/groups/user/:userId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("group_members")
      .select("colour, group_chats(*)")
      .eq("user_id", req.params.userId);
    if (error) throw error;

    const rows = data.map((r) => ({ ...r.group_chats, colour: r.colour }));
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get groups" });
  }
});

app.get("/groups/:groupId/members", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("group_members")
      .select("colour, users(user_id, username, first_name, last_name, avatar_url)")
      .eq("group_id", req.params.groupId);
    if (error) throw error;
    res.json(data.map((r) => ({ ...r.users, colour: r.colour })));
  } catch (error) {
    res.status(500).json({ error: "Failed to get members" });
  }
});

app.post("/groups/:groupId/members", async (req, res) => {
  try {
    const { userId } = req.body;
    const { groupId } = req.params;

    const { data: existing } = await supabase
      .from("group_members")
      .select("colour")
      .eq("group_id", groupId);

    if (existing && existing.length >= 8) {
      return res.status(400).json({ error: "Group is full (max 8 members)" });
    }

    const usedColours = (existing || []).map((r) => r.colour);
    const colour = GROUP_COLOURS.find((c) => !usedColours.includes(c)) || GROUP_COLOURS[0];

    await supabase
      .from("group_members")
      .insert({ id: crypto.randomUUID(), group_id: groupId, user_id: userId, colour });

    res.json({ message: "Member added" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add member" });
  }
});

app.delete("/groups/:groupId/members/:userId", async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { userName } = req.body;

    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);

    await GroupMessage.create({ groupId, senderId: "system", senderName: "system", text: `${userName} left the group`, type: "system" });

    const { data: remaining } = await supabase.from("group_members").select("id").eq("group_id", groupId);
    if (!remaining || remaining.length === 0) {
      await supabase.from("group_chats").delete().eq("id", groupId);
    }

    res.json({ message: "Left group" });
  } catch (error) {
    res.status(500).json({ error: "Failed to leave group" });
  }
});

app.patch("/groups/:groupId/name", async (req, res) => {
  try {
    await supabase.from("group_chats").update({ name: req.body.name }).eq("id", req.params.groupId);
    res.json({ message: "Group renamed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to rename group" });
  }
});

app.post("/groups/:groupId/messages", async (req, res) => {
  try {
    const { senderId, senderName, text, type } = req.body;
    const message = await GroupMessage.create({
      groupId: req.params.groupId,
      senderId,
      senderName,
      text,
      type: type || "message",
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/groups/:groupId/messages", async (req, res) => {
  try {
    const messages = await GroupMessage.find({ groupId: req.params.groupId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// ── HEALTH & R2 TEST ────────────────────────────────────
app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/r2-test", async (req, res) => {
  try {
    const key = "debug/test.txt";
    await uploadToR2({ key, buffer: Buffer.from("hello r2"), contentType: "text/plain" });
    const url = await generateSignedUrl(key);
    res.json({ ok: true, key, url });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// ── START ───────────────────────────────────────────────
connectMongoDB();
try {
 app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));
} catch (err) {
  console.error("Server startup error:", err);
}