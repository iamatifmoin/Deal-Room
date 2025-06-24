import express from "express";
import Deal from "../models/Deal.js";
import Message from "../models/Message.js";
import { authenticateToken } from "../middleware/auth.js";
import { validateDeal } from "../middleware/validation.js";

import multer from "multer";
import { downloadDocument } from "../controllers/downloadDocument.js";
import { uploadDocuments } from "../controllers/uploadDocuments.js";

const router = express.Router();

// Get all deals for authenticated user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const deals = await Deal.find({
      $or: [{ buyer: req.user._id }, { seller: req.user._id }],
    })
      .populate("buyer", "username email role")
      .populate("seller", "username email role")
      .populate("documents")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: deals,
      message: "Deals retrieved successfully",
    });
  } catch (error) {
    console.error("Get deals error:", error);
    res.status(500).json({ message: "Failed to retrieve deals" });
  }
});

// Get single deal
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate("buyer", "_id username email role")
      .populate("seller", "_id username email role")
      .populate("documents");

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    const hasAccess =
      deal.buyer?._id?.toString() === req.user?._id?.toString() ||
      deal.seller?._id?.toString() === req.user?._id?.toString();

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      success: true,
      data: deal,
      message: "Deal retrieved successfully",
    });
  } catch (error) {
    console.error("Get deal error:", error);
    res.status(500).json({ message: "Failed to retrieve deal" });
  }
});

// Create new deal (buyers only)
router.post("/", authenticateToken, validateDeal, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can create deals" });
    }

    if (!req.body.sellerId) {
      return res.status(400).json({ message: "Seller ID is required" });
    }

    const { title, description, proposedPrice } = req.body;

    const deal = new Deal({
      title,
      description,
      proposedPrice,
      currentPrice: proposedPrice,
      buyer: req.user._id,
      seller: req.body.sellerId,
    });

    await deal.save();
    await deal.populate([{ path: "buyer", select: "_id username email role" }]);

    res.status(201).json({
      success: true,
      data: deal,
      message: "Deal created successfully",
    });
  } catch (error) {
    console.error("Create deal error:", error);
    res.status(500).json({ message: "Failed to create deal" });
  }
});

const upload = multer({ storage: multer.memoryStorage() });
router.post(
  "/:id/documents",
  authenticateToken,
  upload.array("documents", 2),
  uploadDocuments
);
router.get("/:id/download", authenticateToken, downloadDocument);

// Accept deal (sellers only)
router.patch("/:id/accept", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can accept deals" });
    }

    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    if (deal.status !== "pending") {
      return res.status(400).json({ message: "Deal is not in pending status" });
    }

    deal.status = "in_progress";
    await deal.save();

    await deal.populate([
      { path: "buyer", select: "_id username email role" },
      { path: "seller", select: "_id username email role" },
    ]);

    res.json({
      success: true,
      data: deal,
      message: "Deal accepted successfully",
    });
  } catch (error) {
    console.error("Accept deal error:", error);
    res.status(500).json({ message: "Failed to accept deal" });
  }
});

// Counter offer (sellers only)
router.patch("/:id/counter", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res
        .status(403)
        .json({ message: "Only sellers can make counter offers" });
    }

    const { price } = req.body;
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ message: "Invalid price" });
    }

    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    if (deal.status !== "pending" && deal.status !== "in_progress") {
      return res.status(400).json({ message: "Cannot counter this deal" });
    }

    deal.currentPrice = price;
    if (!deal.seller.equals(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to negotiate" });
    }
    deal.status = "in_progress";
    deal.negotiationHistory.push({
      price,
      proposedBy: req.user._id,
    });

    await deal.save();
    await deal.populate([
      { path: "buyer", select: "_id username email role" },
      { path: "seller", select: "_id username email role" },
    ]);

    res.json({
      success: true,
      data: deal,
      message: "Counter offer submitted successfully",
    });
  } catch (error) {
    console.error("Counter offer error:", error);
    res.status(500).json({ message: "Failed to submit counter offer" });
  }
});

// Complete deal
router.patch("/:id/complete", authenticateToken, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    const hasAccess =
      deal.buyer?._id?.toString() === req.user?._id?.toString() ||
      deal.seller?._id?.toString() === req.user?._id?.toString();

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (deal.status !== "in_progress") {
      return res
        .status(400)
        .json({ message: "Deal must be in progress to complete" });
    }

    deal.status = "completed";
    await deal.save();

    await deal.populate([
      { path: "buyer", select: "_id username email role" },
      { path: "seller", select: "_id username email role" },
    ]);

    res.json({
      success: true,
      data: deal,
      message: "Deal completed successfully",
    });
  } catch (error) {
    console.error("Complete deal error:", error);
    res.status(500).json({ message: "Failed to complete deal" });
  }
});

// Cancel deal
router.patch("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    const hasAccess =
      deal.buyer?._id?.toString() === req.user?._id?.toString() ||
      deal.seller?._id?.toString() === req.user?._id?.toString();

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (deal.status === "completed") {
      return res.status(400).json({ message: "Cannot cancel completed deal" });
    }

    deal.status = "cancelled";
    await deal.save();

    await deal.populate([
      { path: "buyer", select: "_id username email role" },
      { path: "seller", select: "_id username email role" },
    ]);

    res.json({
      success: true,
      data: deal,
      message: "Deal cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel deal error:", error);
    res.status(500).json({ message: "Failed to cancel deal" });
  }
});

// Get messages for a deal
router.get("/:id/messages", authenticateToken, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate("buyer", "_id username email role")
      .populate("seller", "_id username email role");
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    const hasAccess =
      deal.buyer?._id?.toString() === req.user?._id?.toString() ||
      deal.seller?._id?.toString() === req.user?._id?.toString();

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ dealId: req.params.id })
      .populate("sender", "username email role")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: messages,
      message: "Messages retrieved successfully",
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Failed to retrieve messages" });
  }
});

export default router;
