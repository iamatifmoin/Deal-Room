import { v4 as uuid } from "uuid";
import Deal from "../models/Deal.js";
import { bucket } from "../config/gcs.js";
import mongoose from "mongoose";

export const uploadDocuments = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: "Deal not found" });

    const uploadedDocs = [];

    for (const file of req.files) {
      const gcsFileName = `documents/${uuid()}_${file.originalname}`;
      const blob = bucket.file(gcsFileName);

      const stream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      await new Promise((resolve, reject) => {
        stream.on("error", reject);
        stream.on("finish", resolve);
        stream.end(file.buffer);
      });

      uploadedDocs.push({
        _id: new mongoose.Types.ObjectId(),
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        gcsPath: gcsFileName,
        uploadedAt: new Date(),
      });
    }

    deal.documents.push(...uploadedDocs);
    await deal.save();

    res.status(200).json(deal);
  } catch (err) {
    console.error("GCS Upload Error:", err);
    res.status(500).json({ message: "Failed to upload document" });
  }
};
