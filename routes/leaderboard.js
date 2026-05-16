import express from "express";

import { getLeaderboard } from "../controllers/leaderboardController.js";

const router = express.Router();

// 🚀 PUBLIC LEADERBOARD
router.get(
  "/",

  getLeaderboard,
);

export default router;
