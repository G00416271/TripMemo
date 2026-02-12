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
import stage from './imageStaging.js';

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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const stagedImages = await stage([req.file]);

    // ✅ FIXED - add 'name' property
    const payload = stagedImages.map(img => ({
      name: req.file.originalname || 'image.jpg',  // Add this!
      data: img.buffer.toString("base64")
    }));

    const clipAnalysis = await clipAnalyse(payload);
    return res.json(clipAnalysis);

  } catch (err) {
    console.error(err);
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


//register
app.post("/register", upload.none(), async (req, res) => {
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
    "SELECT user_id, username, email FROM users WHERE user_id = ?",
    [req.userId]
  );

  res.json(rows[0]);
});


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



// ---------------------------------------
//  START SERVER
// ---------------------------------------
try {
  app.listen(PORT, () =>
    console.log(`✅ Server running on http://localhost:${PORT}`)
  );
} catch (err) {
  console.error("Server startup error:", err);
}




//notes: 
// Strip metadata from Client side. 