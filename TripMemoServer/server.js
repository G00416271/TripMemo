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

// Duplicate GET /icons removed — keeping only one
app.get('/icons', (req, res) => {
  res.json({ message: 'Icons are available at /icons/<filename>.svg' });
});

// ---------------------------------------
//  FILE UPLOAD ENDPOINT FOR DATASCRAPER
// ---------------------------------------
const upload = multer({
  dest: path.join(__dirname, "uploads/")
});
app.post("/process-images", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;

    // Ensure array
    const imagesResult = await processImages([filePath]);


    // Extract tags safely
    const tags = imagesResult.tags || [];

    // User interest matching
    const interestsResult = await getInterests(tags, req.body);

    // Neo4j matching
    const neo4jResult = await getNodes(interestsResult.matchedInterests);

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


app.post("/interestReq", upload.none(), async (req, res) => {
  try {
    const result = await getInterests(req.body);
    res.json(result);
  } catch (err) {
    console.error("Error in /interestReq route:", err);
    res.status(500).json({ error: "Processing failed" });
  }
});



// Start server
app.listen(PORT, () => 
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
