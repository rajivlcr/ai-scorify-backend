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

export default router;
