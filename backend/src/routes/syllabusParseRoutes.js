import express from "express";
import { parseSyllabusFile } from "../services/syllabusParseService.js";
import { verifyToken } from "../middleware/auth.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// POST /api/parse-syllabus
// Parse uploaded syllabus and extract relevant subject content
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const { subjectName } = req.body;
    
    if (!subjectName || !req.file) {
      return res.status(400).json({ error: "Missing subjectName or file" });
    }
    const extractedText = await parseSyllabusFile(subjectName, req.file.path);
    
    res.json({ extractedText });
  } catch (err) {
    console.error("Parse syllabus error:", err);
    res.status(500).json({ error: err.message || "Failed to parse syllabus" });
  }
});

export default router;