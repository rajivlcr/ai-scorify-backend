import express from "express";
import Result from "../models/Result.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const data = await Result.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching dashboard" });
  }
});

export default router;
