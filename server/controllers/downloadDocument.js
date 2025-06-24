import { bucket } from "../config/gcs.js";
import Deal from "../models/Deal.js";

export const downloadDocument = async (req, res) => {
  try {
    const docId = req.params.id;
    const deal = await Deal.findOne({ "documents._id": docId });
    if (!deal) return res.status(404).json({ message: "Document not found" });

    const document = deal.documents.id(docId);
    if (!document?.gcsPath) {
      return res.status(404).json({ message: "Invalid document" });
    }

    const file = bucket.file(document.gcsPath);
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000,
    });

    return res.json({ url });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ message: "Failed to download document" });
  }
};
