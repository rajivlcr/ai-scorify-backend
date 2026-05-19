import express from "express";

import { getSubjects, getChapters } from "../controllers/syllabusController.js";

const router = express.Router();

// 🚀 SUBJECTS
router.get(
  "/subjects/:className",

  getSubjects,
);

// 🚀 CHAPTERS
router.get(
  "/:name",

  getChapters,
);

export default router;
