import express from "express";

import { generateQuiz, submitQuiz } from "../controllers/quizController.js";

import auth from "../middleware/auth.js";

import { checkQuizLimit } from "../middleware/checkPlan.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GUEST ROUTES
|--------------------------------------------------------------------------
*/

// Guest users can generate MCQ quizzes
router.post("/generate", generateQuiz);

// Guest users can submit quizzes
router.post("/submit", submitQuiz);

/*
|--------------------------------------------------------------------------
| LOGGED IN USER ROUTES
|--------------------------------------------------------------------------
*/

// Keep future authenticated routes here

export default router;
