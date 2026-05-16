import express from "express";

import { generateQuiz, submitQuiz } from "../controllers/quizController.js";

import auth from "../middleware/auth.js";

import { checkQuizLimit } from "../middleware/checkPlan.js";

const router = express.Router();

// ✅ GENERATE QUIZ
router.post("/generate", auth, checkQuizLimit, generateQuiz);

// ✅ SUBMIT QUIZ
router.post("/submit", auth, submitQuiz);

export default router;
