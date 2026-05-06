import express from "express";
import {
  getSyllabus,
  getSubjectByName,
} from "../controllers/syllabusController.js";

const router = express.Router();

// ✅ get all subjects
router.get("/", getSyllabus);

// ✅ get one subject
router.get("/:name", getSubjectByName);

export default router;
