import express from "express";
import multer from "multer";
import path from "path";
import { authenticateToken } from "../middleware/auth.js";
import { bucket } from "../config/gcs.js";
import Deal from "../models/Deal.js";
import { uploadDocuments } from "../controllers/uploadDocuments.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) cb(null, true);
    else cb(new Error("Only images and documents are allowed"));
  },
});

// ✅ Upload route
router.post(
  "/deals/:id/documents",
  authenticateToken,
  upload.array("documents", 5),
  uploadDocuments
);

// ✅ Download route
router.get("/:id/download", authenticateToken, async (req, res) => {
  try {
    const docId = req.params.id;
    const deal = await Deal.findOne({ "documents._id": docId });
    if (!deal) return res.status(404).json({ message: "Document not found" });

    const document = deal.documents.id(docId);
    if (!document || !document.gcsPath)
      return res.status(404).json({ message: "Invalid document" });

    const file = bucket.file(document.gcsPath);
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000,
    });

    return res.json({ url }); // don't redirect; let client handle it
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Failed to download document" });
  }
});

export default router;
