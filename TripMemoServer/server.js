import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import processImages from './DataScraper.js';
import getInterests from './InterestReq.js';
import getNodes from './neoDB.js';

// Needed to simulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors());

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
  dest: path.join(__dirname, "uploads/")
});

app.post("/process-images", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let filePath;
    try {
      filePath = req.file.path;
    } catch (err) {
      console.error("File path error:", err);
      return res.status(500).json({ error: "Upload failed" });
    }

    // Process images
    let imagesResult = {};
    try {
      imagesResult = await processImages([filePath]);
    } catch (err) {
      console.error("processImages() error:", err);
      return res.status(500).json({ error: "Image processing failed" });
    }

    // Extract tags safely
    let tags = [];
    try {
      tags = imagesResult.tags || [];
    } catch (err) {
      console.error("Tag extraction error:", err);
      tags = [];
    }

    // User interest matching
    let interestsResult = {};
    try {
      interestsResult = await getInterests(tags, req.body);
    } catch (err) {
      console.error("getInterests() error:", err);
      interestsResult = { error: "Interest matching failed" };
    }

    // Neo4j matching
    let neo4jResult = [];
    try {
      neo4jResult = await getNodes(interestsResult.tags || []);
    } catch (err) {
      console.error("Neo4j getNodes() error:", err);
      neo4jResult = [];
    }

    // Final combined response
    const finalResult = {
      imageAnalysis: imagesResult,
      matchedUserInterests: interestsResult,
      relatedLocations: neo4jResult
    };

    res.json(finalResult);

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
