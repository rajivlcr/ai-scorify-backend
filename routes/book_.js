import express from "express";
import multer from "multer";

import { uploadBook } from "../controllers/bookController.js";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
});

router.post("/upload", upload.single("pdf"), uploadBook);

export default router;
