import express from "express";
import { generateQuiz, submitQuiz } from "../controllers/quizController.js";

const router = express.Router();

router.post("/generate", generateQuiz);
router.post("/submit", submitQuiz);

export default router;
