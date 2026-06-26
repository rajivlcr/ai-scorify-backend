import express from "express";

import auth from "../middleware/auth.js";

import { getDashboard } from "../controllers/dashboardController.js";

const router = express.Router();

// 🚀 DASHBOARD
router.get(
  "/",

  auth,

  getDashboard,
);

router.get("/export-bookcontent", async (req, res) => {
  const data = await BookContent.find({});
  res.json(data);
});

export default router;
