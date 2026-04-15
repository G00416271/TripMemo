import 'dotenv/config';  // must be first
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser";


import processImages from './DataScraper.js';
import getInterests from './InterestReq.js';
import getNodes from './neoDB.js';
import getMemories from './MemoriesReq.js';
import { neoConnectTest } from './neoConnectTest.js';
import { mysqlConnectTest } from './dbConnTest.js';
import login, { register } from "./login-register.js";
import requireAuth from "./auth.js"
import db from "./db.js"
import { clipAnalyse } from './clipAnalyse.js';  


import connectMongoDB from './mongoDB.js';
import User from './models/User.js';
import session from 'express-session';
import Message from './models/Message.js';
import crypto from 'crypto';
import GroupMessage from './models/GroupMessage.js';

// Needed to simulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true
}));

// app.options("/*", cors({
//   origin: "http://localhost:5173",
//   credentials: true
// }));

app.use(cookieParser());

// const requireAuth = (req, res, next) => {
//   const userId = req.cookies.session;
//   if (!userId) return res.sendStatus(401);
//   req.userId = userId;
//   next();
// };



// Parse requests
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());`

app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));

app.use(session({
  secret: 'tripmemo_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 86400000
  }
}));


// Serve static icons
app.use('/icons', express.static(path.join(__dirname, 'Icons')));

// GET icons (safe)
app.get('/icons', (req, res) => {
  try {
    res.json({ message: 'Icons are available at /icons/<filename>.svg' });
  } catch (err) {
    console.error("GET /icons error:", err);
    res.status(500).json({ error: "Failed to load icons" });
  }
});

// ---------------------------------------
//  FILE UPLOAD ENDPOINT (DATASCRAPER)
// ---------------------------------------
const upload = multer({
  storage: multer.memoryStorage()
});


// app.post("/process-images", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     const fileBuffer = req.file.buffer;
//     const fileName = req.file.originalname;


//     let filePath;
//     try {
//       filePath = req.file.path;
//     } catch (err) {
//       console.error("File path error:", err);
//       return res.status(500).json({ error: "Upload failed" });
//     }

//     // Process images
//     let imagesResult = {};
//     try {
//       imagesResult = await processImages([filePath]);
//     } catch (err) {
//       console.error("processImages() error:", err);
//       return res.status(500).json({ error: "Image processing failed" });
//     }


//     //clip
//     let clipAnalysis = {};
//     try {
//       clipAnalysis = await clipAnalyseBytes([{ name: fileName, buffer: fileBuffer }]);
//     } catch (err) {
//       console.error("clipAnalyseBytes() error:", err);
//       return res.status(500).json({ error: "CLIP analysis failed" });
//     }

    


//     // Extract tags safely
//     let tags = [];
//     try {
//       tags = imagesResult.tags || [];
//     } catch (err) {
//       console.error("Tag extraction error:", err);
//       tags = [];
//     }

//     // User interest matching
//     let interestsResult = {};
//     try {
//       interestsResult = await getInterests(tags, req.body);
//     } catch (err) {
//       console.error("getInterests() error:", err);
//       interestsResult = { error: "Interest matching failed" };
//     }

//     // Neo4j matching
//     let neo4jResult = [];
//     try {
//       neo4jResult = await getNodes(interestsResult.tags || []);
//     } catch (err) {
//       console.error("Neo4j getNodes() error:", err);
//       neo4jResult = [];
//     }

//     // Final combined response
//     const finalResult = {
//       imageAnalysis: imagesResult,
//       matchedUserInterests: interestsResult,
//       relatedLocations: neo4jResult
//     };

//     res.json(finalResult);

//   } catch (err) {
//     console.error("Error in /process-images route:", err);
//     res.status(500).json({ error: "Processing failed" });
//   }
// });

app.post("/process-images", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileBuffer = req.file.buffer;        // bytes in memory
    const fileName = req.file.originalname;

    // CLIP (Option B)
    let clipAnalysis = [];
    try {
      clipAnalysis = await clipAnalyse([{ name: fileName, buffer: fileBuffer }]);
      console.log("CLIP analysis result:", clipAnalysis);
    } catch (err) {
      console.error("clipAnalyse() error:", err);
      return res.status(500).json({ error: "CLIP analysis failed" });
    }

    // If you still want to run your old pipeline (processImages),
    // it MUST be rewritten to accept buffers too.
    // For now, return CLIP only:
    return res.json(clipAnalysis);

  } catch (err) {
    console.error("Error in /process-images route:", err);
    res.status(500).json({ error: "Processing failed" });
  }
});



// ---------------------------------------
//  QUICK INTEREST CHECK
// ---------------------------------------
app.post("/interestReq", upload.none(), async (req, res) => {
  try {
    const result = await getInterests(req.body);
    res.json(result);
  } catch (err) {
    console.error("Error in /interestReq route:", err);
    res.status(500).json({ error: "Processing failed" });
  }
});

app.post("/memories", upload.none(), async (req, res) => {
  try {
    const result = await getMemories(req.body);
    res.json(result);
  } catch (err) {
    console.error("Error in /interestReq route:", err);
    res.status(500).json({ error: "Processing failed" });
  }
});





//-------------------------------------
//  REGISTER/LOGIN
//-------------------------------------
// app.post("/login", upload.none(), async (req, res) => {
  app.post("/login", async (req, res) => {
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

//new login route 
// app.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user in MongoDB
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(401).json({ error: "Invalid email or password" });
//     }

//     // Check password
//     const bcrypt = await import('bcrypt');
//     const isValidPassword = await bcrypt.compare(password, user.password_hash);

//     if (!isValidPassword) {
//       return res.status(401).json({ error: "Invalid email or password" });
//     }

//     // Set session
//     req.session.userId = user._id;
//     req.session.username = user.username;

//     res.json({ 
//       message: "Login successful",
//       username: user.username,
//       userId: user._id
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ error: "Login failed" });
//   }
// });


//new register route
// app.post("/register", async (req, res) => {
//   try {
//     const { username, email, password, firstName, lastName } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ 
//       $or: [{ email }, { username }] 
//     });

//     if (existingUser) {
//       return res.status(400).json({ 
//         error: existingUser.email === email 
//           ? "Email already registered" 
//           : "Username already taken" 
//       });
//     }

//     // Hash password
//     const bcrypt = await import('bcrypt');
//     const password_hash = await bcrypt.hash(password, 10);

//     // Create new user in MongoDB
//     const newUser = new User({
//       username,
//       email,
//       password_hash,
//       first_name: firstName || 'User',
//       last_name: lastName || 'User',
//     });

//     await newUser.save();

//     res.status(201).json({ 
//       message: "User registered successfully",
//       userId: newUser._id 
//     });
//   } catch (error) {
//     console.error("Register error:", error);
//     res.status(500).json({ error: "Registration failed" });
//   }
// });


//adding friends
// Search users by username
app.get("/users/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const [rows] = await db.execute(
      `SELECT user_id, username, first_name, last_name 
       FROM users 
       WHERE username LIKE ? 
       LIMIT 10`,
      [`%${query}%`]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});
// app.get("/users/search", async (req, res) => {
//   try {
//     const { query } = req.query;
//     if (!query) return res.json([]);

//     const users = await User.find({
//       username: { $regex: query, $options: "i" }
//     }).select("username first_name last_name").limit(10);

//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ error: "Search failed" });
//   }
// });

// Send a friend request
app.post("/users/friend-request/:id", async (req, res) => {
  try {
    const { senderId } = req.body;
    const receiverId = req.params.id;

    await db.execute(
      `INSERT INTO friends (user_id, friend_id, status) 
       VALUES (?, ?, 'pending')
       ON DUPLICATE KEY UPDATE status = status`,
      [senderId, receiverId]
    );

    res.json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Friend request error:", error);
    res.status(500).json({ error: "Failed to send request" });
  }
});
// app.post("/users/friend-request/:id", async (req, res) => {
//   try {
//     const { senderId } = req.body;
//     const receiverId = req.params.id;

//     await User.findByIdAndUpdate(receiverId, {
//       $addToSet: { friendRequests: senderId }
//     });

//     res.json({ message: "Friend request sent" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to send request" });
//   }
// });

// Accept a friend request
app.post("/users/friend-request/:id/accept", async (req, res) => {
  try {
    const { userId } = req.body;
    const senderId = req.params.id;

    // Update the existing request to accepted
    await db.execute(
      `UPDATE friends SET status = 'accepted' 
       WHERE user_id = ? AND friend_id = ?`,
      [senderId, userId]
  );
  // Add the reverse friendship
    await db.execute(
      `INSERT INTO friends (user_id, friend_id, status)
       VALUES (?, ?, 'accepted')
       ON DUPLICATE KEY UPDATE status = 'accepted'`,
      [userId, senderId]
    );

    res.json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Accept error:", error);
    res.status(500).json({ error: "Failed to accept request" });
  }
});
// app.post("/users/friend-request/:id/accept", async (req, res) => {
//   try {
//     const { userId } = req.body;
//     const senderId = req.params.id;

//     // Add each other as friends
//     await User.findByIdAndUpdate(userId, {
//       $addToSet: { friends: senderId },
//       $pull: { friendRequests: senderId }
//     });

//     await User.findByIdAndUpdate(senderId, {
//       $addToSet: { friends: userId }
//     });

//     res.json({ message: "Friend request accepted" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to accept request" });
//   }
// });

// Decline a friend request
app.post("/users/friend-request/:id/decline", async (req, res) => {
  try {
    const { userId } = req.body;
    const senderId = req.params.id;

    await db.execute(
      `DELETE FROM friends 
       WHERE user_id = ? AND friend_id = ?`,
      [senderId, userId]
    );

    res.json({ message: "Friend request declined" });
  } catch (error) {
    res.status(500).json({ error: "Failed to decline request" });
  }
});
// app.post("/users/friend-request/:id/decline", async (req, res) => {
//   try {
//     const { userId } = req.body; 
//     const senderId = req.params.id;

//     await User.findByIdAndUpdate(userId, {
//       $pull: { friendRequests: senderId }
//     });

//     res.json({ message: "Friend request declined" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to decline request" });
//   }
// });

// Get friends list
app.get("/users/:id/friends", async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await db.execute(
      `SELECT u.user_id, u.username, u.first_name, u.last_name, u.avatar_url
       FROM friends f
       JOIN users u ON u.user_id = f.friend_id
       WHERE f.user_id = ? AND f.status = 'accepted'`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get friends" });
  }
});
// app.get("/users/:id/friends", async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id)
//       .populate("friends", "username first_name last_name");

//     res.json(user.friends);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to get friends" });
//   }
// });

// app.get("/users/:id/friends", async (req, res) => {

//   try {

//     const userId = req.params.id;
 
//     const [rows] = await db.execute(

//       `SELECT u.id, u.username, u.first_name, u.last_name

//        FROM friends f

//        JOIN users u ON u.id = f.friend_id

//        WHERE f.user_id = ? AND f.status = 'accepted'`,

//       [userId]

//     );
 
//     res.json(rows);
//     console.log("friends" + rows) 

//   } catch (error) {

//     res.status(500).json({ error: "Failed to get friends" });

//   }

// });
 

// Get friend requests
app.get("/users/:id/friend-requests", async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await db.execute(
      `SELECT u.user_id, u.username, u.first_name, u.last_name, u.avatar_url
       FROM friends f
       JOIN users u ON u.user_id = f.user_id
       WHERE f.friend_id = ? AND f.status = 'pending'`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get requests" });
  }
});
// app.get("/users/:id/friend-requests", async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id)
//       .populate("friendRequests", "username first_name last_name");

//     res.json(user.friendRequests);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to get requests" });
//   }
// });

// app.get("/me/mongo", async (req, res) => {
//   try {
//     const user = await User.findOne({ username: req.session?.username })
//       .select("_id username email");
//     if (!user) return res.sendStatus(401);
//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to get user" });
//   }
// });



// Send a message
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

// Get messages between two users
app.get("/messages/:userId/:friendId", async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    console.log("Fetching messages for:", userId, friendId);

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Messages error:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});
// app.get("/messages/:userId/:friendId", async (req, res) => {
//   try {
//     const { userId, friendId } = req.params;

//     const messages = await Message.find({
//       $or: [
//         { senderId: userId, receiverId: friendId },
//         { senderId: friendId, receiverId: userId }
//       ]
//     }).sort({ createdAt: 1 });

//     res.json(messages);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to get messages" });
//   }
// });




// register
// app.post("/register", upload.none(), async (req, res) => {
//   const {username, firstName, lastName, email, password} = req.body;

app.post("/register", async (req, res) => {
  const {username, firstName, lastName, email, password} = req.body;

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


   return res.status(200).json(user);
});


//auth after login
app.get("/me", requireAuth, async (req, res) => {
  const [rows] = await db.execute(
    "SELECT user_id, username, email, first_name, last_name, avatar_url, created_at FROM users WHERE user_id = ?",
    [req.userId]
  );
  res.json(rows[0]);
});
// app.get("/me", requireAuth, async (req, res) => {
//   const [rows] = await db.execute(
//     "SELECT user_id, username, email FROM users WHERE user_id = ?",
//     [req.userId]
//   );

//   res.json(rows[0]);
// });



//logout
app.post("/logout", (req, res) => {
  res.clearCookie("session", {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true in prod
  });

  res.sendStatus(200);
});



//connection tests
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


// Get SOS contacts
app.get("/sos-contacts/:userId", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.user_id, u.username, u.first_name, u.last_name
       FROM sos_contacts sc
       JOIN users u ON u.user_id = sc.friend_id
       WHERE sc.user_id = ?`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Get SOS contacts error:", error);
    res.status(500).json({ error: "Failed to get SOS contacts" });
  }
});

// Add SOS contact
app.post("/sos-contacts", async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    await db.execute(
      `INSERT IGNORE INTO sos_contacts (user_id, friend_id) VALUES (?, ?)`,
      [userId, friendId]
    );
    res.json({ message: "SOS contact added" });
  } catch (error) {
    console.error("Add SOS contact error:", error);
    res.status(500).json({ error: "Failed to add SOS contact" });
  }
});

// Remove SOS contact
app.delete("/sos-contacts/:userId/:friendId", async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    await db.execute(
      `DELETE FROM sos_contacts WHERE user_id = ? AND friend_id = ?`,
      [userId, friendId]
    );
    res.json({ message: "SOS contact removed" });
  } catch (error) {
    console.error("Remove SOS contact error:", error);
    res.status(500).json({ error: "Failed to remove SOS contact" });
  }
});


// ── BUCKET LISTS ──────────────────────────────────────────

// Get items for a bucket list — MUST be before /:id
app.get("/bucket-lists/:id/items", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM bucket_list_items WHERE bucket_list_id = ? ORDER BY position`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get items" });
  }
});

// Add item to bucket list — MUST be before /:id
app.post("/bucket-lists/:id/items", async (req, res) => {
  try {
    const { type, content, position } = req.body;
    const itemId = crypto.randomUUID();
    await db.execute(
      `INSERT INTO bucket_list_items (id, bucket_list_id, type, content, position) VALUES (?, ?, ?, ?, ?)`,
      [itemId, req.params.id, type, content, position || 0]
    );
    const [rows] = await db.execute(
      `SELECT * FROM bucket_list_items WHERE id = ?`,
      [itemId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to add item" });
  }
});

// Update last accessed — MUST be before /:id
app.patch("/bucket-lists/:id/accessed", async (req, res) => {
  try {
    await db.execute(
      `UPDATE bucket_lists SET last_accessed = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.params.id]
    );
    res.json({ message: "Last accessed updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update last accessed" });
  }
});

// Delete item — MUST be before /:id
app.delete("/bucket-lists/items/:itemId", async (req, res) => {
  try {
    await db.execute(
      `DELETE FROM bucket_list_items WHERE id = ?`,
      [req.params.itemId]
    );
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Update item content — MUST be before /:id
app.patch("/bucket-lists/items/:itemId", async (req, res) => {
  try {
    const { content } = req.body;
    await db.execute(
      `UPDATE bucket_list_items SET content = ? WHERE id = ?`,
      [content, req.params.itemId]
    );
    res.json({ message: "Item updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

// Check item — MUST be before /:id
app.patch("/bucket-lists/items/:itemId/check", async (req, res) => {
  try {
    const { checked } = req.body;
    await db.execute(
      `UPDATE bucket_list_items SET checked = ? WHERE id = ?`,
      [checked, req.params.itemId]
    );
    res.json({ message: "Item checked" });
  } catch (error) {
    res.status(500).json({ error: "Failed to check item" });
  }
});

// Get all bucket lists for a user
app.get("/bucket-lists/:userId", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM bucket_lists WHERE user_id = ? ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Get bucket lists error:", error);
    res.status(500).json({ error: "Failed to get bucket lists" });
  }
});

// Create a bucket list
app.post("/bucket-lists", async (req, res) => {
  try {
    const { userId, title } = req.body;
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO bucket_lists (id, user_id, title) VALUES (?, ?, ?)`,
      [id, userId, title]
    );
    const [rows] = await db.execute(
      `SELECT * FROM bucket_lists WHERE id = ?`,
      [id]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Create bucket list error:", error);
    res.status(500).json({ error: "Failed to create bucket list" });
  }
});

// Rename a bucket list
app.patch("/bucket-lists/:id", async (req, res) => {
  try {
    const { title } = req.body;
    await db.execute(
      `UPDATE bucket_lists SET title = ? WHERE id = ?`,
      [title, req.params.id]
    );
    res.json({ message: "Bucket list renamed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to rename bucket list" });
  }
});

// Delete a bucket list
app.delete("/bucket-lists/:id", async (req, res) => {
  try {
    await db.execute(`DELETE FROM bucket_lists WHERE id = ?`, [req.params.id]);
    res.json({ message: "Bucket list deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete bucket list" });
  }
});

// Get saved places for a user
app.get("/saved-places/:userId", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM saved_places WHERE user_id = ? ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Get saved places error:", error);
    res.status(500).json({ error: "Failed to get saved places" });
  }
});

// Save a place (for maps)
app.post("/saved-places", async (req, res) => {
  try {
    const { userId, name, latitude, longitude } = req.body;
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO saved_places (id, user_id, name, latitude, longitude) VALUES (?, ?, ?, ?, ?)`,
      [id, userId, name, latitude, longitude]
    );
    const [rows] = await db.execute(
      `SELECT * FROM saved_places WHERE id = ?`,
      [id]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Save place error:", error);
    res.status(500).json({ error: "Failed to save place" });
  }
});

// Delete a saved place
app.delete("/saved-places/:id", async (req, res) => {
  try {
    await db.execute(
      `DELETE FROM saved_places WHERE id = ?`,
      [req.params.id]
    );
    res.json({ message: "Place deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete place" });
  }
});

// Update avatar
app.patch("/users/:userId/avatar", async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    await db.execute(
      `UPDATE users SET avatar_url = ? WHERE user_id = ?`,
      [avatarUrl, req.params.userId]
    );
    res.json({ message: "Avatar updated" });
  } catch (error) {
    console.error("Update avatar error:", error);
    res.status(500).json({ error: "Failed to update avatar" });
  }
});

// Update profile
app.patch("/users/:userId/profile", async (req, res) => {
  try {
    const { firstName, lastName, username } = req.body;

    // Check if username is taken by someone else
    const [existing] = await db.execute(
      `SELECT user_id FROM users WHERE username = ? AND user_id != ?`,
      [username, req.params.userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    await db.execute(
      `UPDATE users SET first_name = ?, last_name = ?, username = ? WHERE user_id = ?`,
      [firstName, lastName, username, req.params.userId]
    );

    res.json({ message: "Profile updated" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// DA GROUP CHATSSSS

const GROUP_COLOURS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

// Create a group
app.post("/groups", async (req, res) => {
  try {
    const { name, createdBy, memberIds } = req.body;

    if (memberIds.length > 7) {
      return res.status(400).json({ error: "Max 8 members including yourself" });
    }

    const groupId = crypto.randomUUID();

    await db.execute(
      `INSERT INTO group_chats (id, name, created_by) VALUES (?, ?, ?)`,
      [groupId, name, createdBy]
    );

    // Add all members including creator
    const allMembers = [createdBy, ...memberIds];
    for (let i = 0; i < allMembers.length; i++) {
      const memberId = allMembers[i];
      const colour = GROUP_COLOURS[i % GROUP_COLOURS.length];
      await db.execute(
        `INSERT INTO group_members (id, group_id, user_id, colour) VALUES (?, ?, ?, ?)`,
        [crypto.randomUUID(), groupId, memberId, colour]
      );
    }

    // Send system message
    await GroupMessage.create({
      groupId,
      senderId: 'system',
      senderName: 'system',
      text: 'Group created',
      type: 'system'
    });

    const [group] = await db.execute(
      `SELECT * FROM group_chats WHERE id = ?`,
      [groupId]
    );

    res.status(201).json(group[0]);
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Get groups for a user
app.get("/groups/user/:userId", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT g.*, gm.colour 
       FROM group_chats g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = ?
       ORDER BY g.created_at DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get groups" });
  }
});

// Get group members
app.get("/groups/:groupId/members", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.user_id, u.username, u.first_name, u.last_name, u.avatar_url, gm.colour
       FROM group_members gm
       JOIN users u ON u.user_id = gm.user_id
       WHERE gm.group_id = ?`,
      [req.params.groupId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get members" });
  }
});

// Add member to group
app.post("/groups/:groupId/members", async (req, res) => {
  try {
    const { userId } = req.body;
    const { groupId } = req.params;

    // Check max members
    const [members] = await db.execute(
      `SELECT COUNT(*) as count FROM group_members WHERE group_id = ?`,
      [groupId]
    );

    if (members[0].count >= 8) {
      return res.status(400).json({ error: "Group is full (max 8 members)" });
    }

    // Assign next available colour
    const [existingColours] = await db.execute(
      `SELECT colour FROM group_members WHERE group_id = ?`,
      [groupId]
    );
    const usedColours = existingColours.map(r => r.colour);
    const colour = GROUP_COLOURS.find(c => !usedColours.includes(c)) || GROUP_COLOURS[0];

    await db.execute(
      `INSERT INTO group_members (id, group_id, user_id, colour) VALUES (?, ?, ?, ?)`,
      [crypto.randomUUID(), groupId, userId, colour]
    );

    res.json({ message: "Member added" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add member" });
  }
});

// Leave group
app.delete("/groups/:groupId/members/:userId", async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { userName } = req.body;

    await db.execute(
      `DELETE FROM group_members WHERE group_id = ? AND user_id = ?`,
      [groupId, userId]
    );

    // Send system message
    await GroupMessage.create({
      groupId,
      senderId: 'system',
      senderName: 'system',
      text: `${userName} left the group`,
      type: 'system'
    });

    // Delete group if no members left
    const [members] = await db.execute(
      `SELECT COUNT(*) as count FROM group_members WHERE group_id = ?`,
      [groupId]
    );

    if (members[0].count === 0) {
      await db.execute(`DELETE FROM group_chats WHERE id = ?`, [groupId]);
    }

    res.json({ message: "Left group" });
  } catch (error) {
    res.status(500).json({ error: "Failed to leave group" });
  }
});

// Rename group
app.patch("/groups/:groupId/name", async (req, res) => {
  try {
    const { name } = req.body;
    await db.execute(
      `UPDATE group_chats SET name = ? WHERE id = ?`,
      [name, req.params.groupId]
    );
    res.json({ message: "Group renamed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to rename group" });
  }
});

// Send group message
app.post("/groups/:groupId/messages", async (req, res) => {
  try {
    const { senderId, senderName, text, type } = req.body;
    const message = await GroupMessage.create({
      groupId: req.params.groupId,
      senderId,
      senderName,
      text,
      type: type || 'message'
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get group messages
app.get("/groups/:groupId/messages", async (req, res) => {
  try {
    const messages = await GroupMessage.find({
      groupId: req.params.groupId
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// ---------------------------------------
//  START SERVER
// ---------------------------------------
connectMongoDB(); //connects to mongodb
try {
  app.listen(PORT, () =>
    console.log(`✅ Server running on http://localhost:${PORT}`)
  );
} catch (err) {
  console.error("Server startup error:", err);
}




//notes: 
// Strip metadata from Client side. 