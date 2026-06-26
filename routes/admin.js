import express from "express";

import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";

import {
  getStats,
  getUsers,
  updatePlan,
  deleteUser,
  getQuestionBanks,
  getQuestionBank,
} from "../controllers/adminController.js";

const router = express.Router();

// 🚀 STATS
router.get("/stats", auth, admin, getStats);

// 🚀 USERS
router.get("/users", auth, admin, getUsers);

// 🚀 UPDATE PLAN
router.put("/user/:id/plan", auth, admin, updatePlan);

// 🚀 DELETE USER
router.delete("/user/:id", auth, admin, deleteUser);

// 🚀 QUESTION BANKS
router.get("/question-banks", auth, admin, getQuestionBanks);

// 🚀 SINGLE QUESTION BANK
router.get("/question-bank/:id", auth, admin, getQuestionBank);

export default router;
