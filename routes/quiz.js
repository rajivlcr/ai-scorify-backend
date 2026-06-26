import express from "express";

import {
  generateQuiz,
  generateRevisionQuiz,
  submitQuiz,
} from "../controllers/quizController.js";

import optionalAuth from "../middleware/optionalAuth.js";

const router = express.Router();

// 🚀 NORMAL QUIZ
router.post("/generate", optionalAuth, generateQuiz);

// 🚀 REVISION QUIZ
router.get("/revision", optionalAuth, generateRevisionQuiz);

// 🚀 SUBMIT QUIZ
router.post("/submit", optionalAuth, submitQuiz);

export default router;
