import express from "express";
import auth from "../middleware/auth.js";
import { getStudyNotes } from "../controllers/studyNotesController.js";

const router = express.Router();

router.post("/", auth, getStudyNotes);

export default router;
