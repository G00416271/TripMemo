import "dotenv/config"; // must be first

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import fs from "fs";
import crypto from "crypto";

import { uploadToR2, generateSignedUrl } from "./r2.js";
import processImages from "./DataScraper.js";
import getInterests from "./InterestReq.js";
import getNodes from "./neoDB.js";
import getMemories from "./MemoriesReq.js";
import { neoConnectTest } from "./neoConnectTest.js";
import { mysqlConnectTest } from "./dbConnTest.js";
import login, { register } from "./login-register.js";
import requireAuth from "./auth.js";
import db from "./db.js";
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
import User from "./models/User.js";
import session from "express-session";
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
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true, limit: "500mb" }));
app.use(bodyParser.json({ limit: "500mb" }));
app.use("/api/canvas", canvasDbRoutes);
app.use("/api/canvas", canvasShareRoutes);

app.use("/icons", express.static(path.join(__dirname, "Icons")));

app.get("/icons", (req, res) => {
  try {
    res.json({ message: "Icons are available at /icons/<filename>.svg" });
  } catch (err) {
    console.error("GET /icons error:", err);
    res.status(500).json({ error: "Failed to load icons" });
  }
});


app.get('/health', (req, res) => res.json({ ok: true }));

// ---------------------------------------
//  FILE UPLOAD ENDPOINT (DATASCRAPER)
// ---------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

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
    console.log(JSON.stringify(clipAnalysis, null, 2));

    return res.json(clipAnalysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Processing failed" });
  }
});

app.get("/debug-tags", async (req, res) => {
  const { rows } = await db.query(
    "SELECT tags, jsonb_typeof(tags::jsonb) AS t FROM memories WHERE memory_id = $1",
    [Number(req.query.memoryId)],
  );
  res.json(rows[0] ?? null);
});

// ---------------------------------------
//  QUICK INTEREST CHECK
// ---------------------------------------
app.post("/interestReq", upload.none(), async (req, res) => {
  try {
    const tags = Array.isArray(req.body?.tags) ? req.body.tags : [];
    const fields = req.body;

    const result = await getInterests(tags, fields);
    res.json(result);
  } catch (err) {
    console.error("Error in /interestReq route:", err);
    res.status(500).json({ error: "Processing failed" });
  }
});

//-------------------------------------
//  REGISTER/LOGIN
//-------------------------------------
app.post("/login", upload.none(), async (req, res) => {
  const { email, username, password } = req.body;

  if (!password || (!username && !email)) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const user = await login(email, username, password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.cookie("session", user.user_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 86400000,
  });

  return res.status(200).json(user);
});

// ---------------------------------------
//  USER SEARCH
// ---------------------------------------
app.get("/users/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const requestingUserId = req.cookies?.session;

    const { rows } = await db.query(
      `SELECT user_id, username, first_name, last_name, avatar_url
       FROM users
       WHERE (username ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)
         AND user_id <> $2
       LIMIT 10`,
      [`%${query}%`, requestingUserId]
    );

    res.json(rows);
  } catch (error) {
    console.error("🔥 /users/search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});


// Send friend request
app.post("/users/friend-request/:id", async (req, res) => {
  try {
    const { senderId } = req.body;
    const receiverId = req.params.id;

    await db.query(
      `INSERT INTO friends (user_id, friend_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (user_id, friend_id) DO NOTHING`,
      [senderId, receiverId],
    );

    res.json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Friend request error:", error.message);
    res.status(500).json({ error: "Failed to send request" });
  }
});

// Accept friend request
app.post("/users/friend-request/:id/accept", async (req, res) => {
  try {
    const { userId } = req.body;
    const senderId = req.params.id;

    await db.query(
      `UPDATE friends SET status = 'accepted'
       WHERE user_id = $1 AND friend_id = $2`,
      [senderId, userId],
    );
    await db.query(
      `INSERT INTO friends (user_id, friend_id, status)
       VALUES ($1, $2, 'accepted')
       ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'`,
      [userId, senderId],
    );

    res.json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Accept error:", error);
    res.status(500).json({ error: "Failed to accept request" });
  }
});

// Decline friend request
app.post("/users/friend-request/:id/decline", async (req, res) => {
  try {
    const { userId } = req.body;
    const senderId = req.params.id;

    await db.query(
      `DELETE FROM friends
       WHERE user_id = $1 AND friend_id = $2`,
      [senderId, userId],
    );

    res.json({ message: "Friend request declined" });
  } catch (error) {
    res.status(500).json({ error: "Failed to decline request" });
  }
});

// Get friends list
app.get("/users/:id/friends", async (req, res) => {
  try {
    const userId = req.params.id;
    const { rows } = await db.query(
      `SELECT u.user_id, u.username, u.first_name, u.last_name, u.avatar_url
       FROM friends f
       JOIN users u ON u.user_id = f.friend_id
       WHERE f.user_id = $1 AND f.status = 'accepted'`,
      [userId],
    );
    res.json(rows);
  } catch (error) {
    console.error("Get friends error:", error.message); // <-- add this
    res.status(500).json({ error: "Failed to get friends" });
  }
});

// Get friend requests
app.get("/users/:id/friend-requests", async (req, res) => {
  try {
    const userId = req.params.id;
    const { rows } = await db.query(
      `SELECT u.user_id, u.username, u.first_name, u.last_name, u.avatar_url
       FROM friends f
       JOIN users u ON u.user_id = f.user_id
       WHERE f.friend_id = $1 AND f.status = 'pending'`,
      [userId],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get requests" });
  }
});

// ---------------------------------------
//  MESSAGES (Mongo)
// ---------------------------------------
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
    console.log("Fetching messages for:", userId, friendId);

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Messages error:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// ---------------------------------------
//  REGISTER
// ---------------------------------------
app.post("/register", async (req, res) => {
  const { username, firstName, lastName, email, password } = req.body;

  if (!password || (!username && !email)) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const user = await register(username, firstName, lastName, email, password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.cookie("session", user.user_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 86400000,
  });

  return res.status(201).json(user);
});

// ---------------------------------------
//  ME / LOGOUT
// ---------------------------------------
app.get("/me", requireAuth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT user_id, username, email, first_name, last_name, avatar_url, created_at
     FROM users WHERE user_id = $1`,
    [req.userId],
  );
  res.json(rows[0]);
});

app.post("/logout", (req, res) => {
  res.clearCookie("session", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  res.sendStatus(200);
});

// ---------------------------------------
//  MEMORIES
// ---------------------------------------
app.post("/memories", upload.none(), async (req, res) => {
  try {
    const result = await getMemories(req.body);
    res.json(result ?? { ok: true });
  } catch (err) {
    console.error("Error in /memories route:", err);
    res.status(500).json({ error: "Processing failed" });
  }
});

// ---------------------------------------
//  CHALLENGES
// ---------------------------------------
app.post(
  "/challenge-submit",
  requireAuth,
  upload.array("images"),
  async (req, res) => {
    try {
      const taskId = req.body.taskId;
      const clipHint = req.body.clipHint;
      const location = req.body.location
        ? JSON.parse(req.body.location)
        : null;

      const imageVectors = await embedImages(req.files ?? []);

      console.group(`📤 /challenge-submit  •  ${taskId}`);
      console.log("clipHint:", clipHint);
      console.log("location:", location);
      console.log("images:", `${req.files?.length ?? 0} file(s)`);
      console.log("vectorDims:", imageVectors[0]?.length ?? 0);
      console.groupEnd();

      const result = await validateChallenge({
        userId: req.userId,
        taskId,
        imageVectors,
        location,
      });

      res.status(result.success ? 200 : 422).json(result);
    } catch (err) {
      console.error("challenge-submit error:", err);
      res.status(500).json({
        success: false,
        reason: "server_error",
        message: "Server error. Please try again.",
      });
    }
  },
);

app.get("/challenge-completions", requireAuth, async (req, res) => {
  const completions = await getCompletedChallenges(req.userId);
  res.json(completions);
});

app.get("/challenges/completed", requireAuth, async (req, res) => {
  const data = await getCompletedChallenges(req.userId);
  res.json(data);
});

// ---------------------------------------
//  DEEZER
// ---------------------------------------
app.get("/api/deezer/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Missing query" });

    const response = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(q)}`,
    );

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
    console.error(err);
    res.status(500).json({ error: "Deezer fetch failed" });
  }
});

// ---------------------------------------
//  EXPLORE
// ---------------------------------------
app.get("/memories/explore", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         m.memory_id,
         m.title,
         m.created_at,
         m.privacy_level,
         m.user_id,
         u.username,
         u.first_name,
         u.last_name,
         u.avatar_url
       FROM memories m
       JOIN users u ON u.user_id = m.user_id
       WHERE m.privacy_level = 'public'
         AND m.deleted_at IS NULL
       ORDER BY m.created_at DESC
       LIMIT 100`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Explore error:", error);
    res.status(500).json({ error: "Failed to fetch public memories" });
  }
});

// ---------------------------------------
//  IMAGE PROXY
// ---------------------------------------
app.get("/api/image-proxy", async (req, res) => {
  try {
    const url = req.query.url;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      console.log("Invalid URL received:", url);
      return res.status(400).send("Invalid or missing URL");
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.log("❌ Fetch failed:", response.status);
      return res.status(500).send("Failed to fetch image");
    }

    const buffer = await response.arrayBuffer();

    res.set(
      "Content-Type",
      response.headers.get("content-type") || "image/jpeg",
    );

    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("❌ Proxy error:", err);
    res.status(500).send("Proxy error");
  }
});

// ---------------------------------------
//  HEALTH CHECKS
// ---------------------------------------
app.get("/ping", (req, res) => {
  res.send("pong");
});

app.get("/neoping", async (req, res) => {
  const result = await neoConnectTest();
  res.json(result);
});

app.get("/mysqlping", async (req, res) => {
  const result = await mysqlConnectTest();
  res.json(result);
});

// ---------------------------------------
//  SOS CONTACTS
// ---------------------------------------
app.get("/sos-contacts/:userId", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.user_id, u.username, u.first_name, u.last_name
       FROM sos_contacts sc
       JOIN users u ON u.user_id = sc.friend_id
       WHERE sc.user_id = $1`,
      [req.params.userId],
    );
    res.json(rows);
  } catch (error) {
    console.error("Get SOS contacts error:", error);
    res.status(500).json({ error: "Failed to get SOS contacts" });
  }
});

app.post("/sos-contacts", async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    await db.query(
      `INSERT INTO sos_contacts (user_id, friend_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, friendId],
    );
    res.json({ message: "SOS contact added" });
  } catch (error) {
    console.error("Add SOS contact error:", error);
    res.status(500).json({ error: "Failed to add SOS contact" });
  }
});

app.delete("/sos-contacts/:userId/:friendId", async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    await db.query(
      `DELETE FROM sos_contacts WHERE user_id = $1 AND friend_id = $2`,
      [userId, friendId],
    );
    res.json({ message: "SOS contact removed" });
  } catch (error) {
    console.error("Remove SOS contact error:", error);
    res.status(500).json({ error: "Failed to remove SOS contact" });
  }
});

// ---------------------------------------
//  BUCKET LISTS
// ---------------------------------------
app.get("/bucket-lists/:id/items", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM bucket_list_items WHERE bucket_list_id = $1 ORDER BY position`,
      [req.params.id],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get items" });
  }
});

app.post("/bucket-lists/:id/items", async (req, res) => {
  try {
    const { type, content, position } = req.body;
    const itemId = crypto.randomUUID();
    const { rows } = await db.query(
      `INSERT INTO bucket_list_items (id, bucket_list_id, type, content, position)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [itemId, req.params.id, type, content, position || 0],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to add item" });
  }
});

app.patch("/bucket-lists/:id/accessed", async (req, res) => {
  try {
    await db.query(
      `UPDATE bucket_lists SET last_accessed = CURRENT_TIMESTAMP WHERE id = $1`,
      [req.params.id],
    );
    res.json({ message: "Last accessed updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update last accessed" });
  }
});

app.delete("/bucket-lists/items/:itemId", async (req, res) => {
  try {
    await db.query(`DELETE FROM bucket_list_items WHERE id = $1`, [req.params.itemId]);
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

app.patch("/bucket-lists/items/:itemId", async (req, res) => {
  try {
    const { content } = req.body;
    await db.query(
      `UPDATE bucket_list_items SET content = $1 WHERE id = $2`,
      [content, req.params.itemId],
    );
    res.json({ message: "Item updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

app.patch("/bucket-lists/items/:itemId/check", async (req, res) => {
  try {
    const { checked } = req.body;
    await db.query(
      `UPDATE bucket_list_items SET checked = $1 WHERE id = $2`,
      [checked, req.params.itemId],
    );
    res.json({ message: "Item checked" });
  } catch (error) {
    res.status(500).json({ error: "Failed to check item" });
  }
});

app.get("/bucket-lists/:userId", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM bucket_lists WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.params.userId],
    );
    res.json(rows);
  } catch (error) {
    console.error("Get bucket lists error:", error);
    res.status(500).json({ error: "Failed to get bucket lists" });
  }
});

app.post("/bucket-lists", async (req, res) => {
  try {
    const { userId, title } = req.body;
    const id = crypto.randomUUID();
    const { rows } = await db.query(
      `INSERT INTO bucket_lists (id, user_id, title) VALUES ($1, $2, $3) RETURNING *`,
      [id, userId, title],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Create bucket list error:", error);
    res.status(500).json({ error: "Failed to create bucket list" });
  }
});

app.patch("/bucket-lists/:id", async (req, res) => {
  try {
    const { title } = req.body;
    await db.query(`UPDATE bucket_lists SET title = $1 WHERE id = $2`, [title, req.params.id]);
    res.json({ message: "Bucket list renamed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to rename bucket list" });
  }
});

app.delete("/bucket-lists/:id", async (req, res) => {
  try {
    await db.query(`DELETE FROM bucket_lists WHERE id = $1`, [req.params.id]);
    res.json({ message: "Bucket list deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete bucket list" });
  }
});

// ---------------------------------------
//  SAVED PLACES
// ---------------------------------------
app.get("/saved-places/:userId", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM saved_places WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.params.userId],
    );
    res.json(rows);
  } catch (error) {
    console.error("Get saved places error:", error);
    res.status(500).json({ error: "Failed to get saved places" });
  }
});

app.post("/saved-places", async (req, res) => {
  try {
    const { userId, name, latitude, longitude } = req.body;
    const id = crypto.randomUUID();
    const { rows } = await db.query(
      `INSERT INTO saved_places (id, user_id, name, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, userId, name, latitude, longitude],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Save place error:", error);
    res.status(500).json({ error: "Failed to save place" });
  }
});

app.delete("/saved-places/:id", async (req, res) => {
  try {
    await db.query(`DELETE FROM saved_places WHERE id = $1`, [req.params.id]);
    res.json({ message: "Place deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete place" });
  }
});

// ---------------------------------------
//  PROFILE
// ---------------------------------------
app.patch("/users/:userId/avatar", async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    await db.query(
      `UPDATE users SET avatar_url = $1 WHERE user_id = $2`,
      [avatarUrl, req.params.userId],
    );
    res.json({ message: "Avatar updated" });
  } catch (error) {
    console.error("Update avatar error:", error);
    res.status(500).json({ error: "Failed to update avatar" });
  }
});

app.patch("/users/:userId/profile", async (req, res) => {
  try {
    const { firstName, lastName, username } = req.body;

    const { rows: existing } = await db.query(
      `SELECT user_id FROM users WHERE username = $1 AND user_id <> $2`,
      [username, req.params.userId],
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    await db.query(
      `UPDATE users SET first_name = $1, last_name = $2, username = $3 WHERE user_id = $4`,
      [firstName, lastName, username, req.params.userId],
    );

    res.json({ message: "Profile updated" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ---------------------------------------
//  GROUP CHATS
// ---------------------------------------
const GROUP_COLOURS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
];

app.post("/groups", async (req, res) => {
  try {
    const { name, createdBy, memberIds } = req.body;

    if (memberIds.length > 7) {
      return res.status(400).json({ error: "Max 8 members including yourself" });
    }

    const groupId = crypto.randomUUID();

    await db.query(
      `INSERT INTO group_chats (id, name, created_by) VALUES ($1, $2, $3)`,
      [groupId, name, createdBy],
    );

    const allMembers = [createdBy, ...memberIds];
    for (let i = 0; i < allMembers.length; i++) {
      const memberId = allMembers[i];
      const colour = GROUP_COLOURS[i % GROUP_COLOURS.length];
      await db.query(
        `INSERT INTO group_members (id, group_id, user_id, colour) VALUES ($1, $2, $3, $4)`,
        [crypto.randomUUID(), groupId, memberId, colour],
      );
    }

    await GroupMessage.create({
      groupId,
      senderId: "system",
      senderName: "system",
      text: "Group created",
      type: "system",
    });

    const { rows: group } = await db.query(
      `SELECT * FROM group_chats WHERE id = $1`,
      [groupId],
    );

    res.status(201).json(group[0]);
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
});

app.get("/groups/user/:userId", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT g.*, gm.colour
       FROM group_chats g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [req.params.userId],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get groups" });
  }
});

app.get("/groups/:groupId/members", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.user_id, u.username, u.first_name, u.last_name, u.avatar_url, gm.colour
       FROM group_members gm
       JOIN users u ON u.user_id = gm.user_id
       WHERE gm.group_id = $1`,
      [req.params.groupId],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get members" });
  }
});

app.post("/groups/:groupId/members", async (req, res) => {
  try {
    const { userId } = req.body;
    const { groupId } = req.params;

    const { rows: members } = await db.query(
      `SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1`,
      [groupId],
    );

    if (members[0].count >= 8) {
      return res.status(400).json({ error: "Group is full (max 8 members)" });
    }

    const { rows: existingColours } = await db.query(
      `SELECT colour FROM group_members WHERE group_id = $1`,
      [groupId],
    );
    const usedColours = existingColours.map((r) => r.colour);
    const colour = GROUP_COLOURS.find((c) => !usedColours.includes(c)) || GROUP_COLOURS[0];

    await db.query(
      `INSERT INTO group_members (id, group_id, user_id, colour) VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), groupId, userId, colour],
    );

    res.json({ message: "Member added" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add member" });
  }
});

app.delete("/groups/:groupId/members/:userId", async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { userName } = req.body;

    await db.query(
      `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId],
    );

    await GroupMessage.create({
      groupId,
      senderId: "system",
      senderName: "system",
      text: `${userName} left the group`,
      type: "system",
    });

    const { rows: members } = await db.query(
      `SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1`,
      [groupId],
    );

    if (members[0].count === 0) {
      await db.query(`DELETE FROM group_chats WHERE id = $1`, [groupId]);
    }

    res.json({ message: "Left group" });
  } catch (error) {
    res.status(500).json({ error: "Failed to leave group" });
  }
});

app.patch("/groups/:groupId/name", async (req, res) => {
  try {
    const { name } = req.body;
    await db.query(
      `UPDATE group_chats SET name = $1 WHERE id = $2`,
      [name, req.params.groupId],
    );
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
    const messages = await GroupMessage.find({
      groupId: req.params.groupId,
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// ---------------------------------------
//  R2 TEST
// ---------------------------------------
app.get("/r2-test", async (req, res) => {
  try {
    const key = "debug/test.txt";
    await uploadToR2({
      key,
      buffer: Buffer.from("hello r2"),
      contentType: "text/plain",
    });
    const url = await generateSignedUrl(key);
    res.json({ ok: true, key, url });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// ---------------------------------------
//  START SERVER
// ---------------------------------------
connectMongoDB();
try {
  app.listen(PORT, () =>
    console.log(`✅ Server running on http://localhost:${PORT}`),
  );
} catch (err) {
  console.error("Server startup error:", err);
}