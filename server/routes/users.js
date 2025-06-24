import express from "express";
import User from "../models/User.js";

const router = express.Router();

// GET /users?role=seller
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({ message: "Missing role parameter" });
    }

    // Find all users matching the role, return only needed fields
    const users = await User.find({ role }).select("_id username email");

    res.status(200).json(users); // <-- returns array, not wrapped
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
