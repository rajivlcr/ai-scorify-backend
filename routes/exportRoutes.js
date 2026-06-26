// routes/exportRoutes.js

import express from "express";
import BookContent from "../models/BookContent.js";
import QuestionBank from "../models/QuestionBank.js";

const router = express.Router();

router.get("/export-bookcontent", async (req, res) => {
  try {
    const data = await BookContent.find({});
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/export-questionbank", async (req, res) => {
  try {
    const data = await QuestionBank.find({});
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
