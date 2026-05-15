import fs from "fs";
import path from "path";

import dotenv from "dotenv";
import mongoose from "mongoose";

import BookContent from "../models/BookContent.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const uploadsDir = "./uploads";

// ✅ CLEAN TEXT FUNCTION
function cleanText(text) {
  return (
    text

      // remove page numbers
      .replace(/^\s*\d+\s*$/gm, "")

      // remove repeated empty lines
      .replace(/\n\s*\n/g, "\n")

      // remove multiple spaces
      .replace(/[ \t]+/g, " ")

      // remove long underscores
      .replace(/_+/g, "")

      // trim final output
      .trim()
  );
}

// ✅ PROCESS EACH TXT FILE
async function processTXT(filePath, className, subject, chapter) {
  try {
    console.log(`Processing: ${chapter}`);

    const rawText = fs.readFileSync(filePath, "utf-8");

    const extractedText = cleanText(rawText);

    // ✅ UPSERT prevents duplicates
    await BookContent.findOneAndUpdate(
      {
        className,
        subject,
        chapter,
      },
      {
        content: extractedText,
      },
      {
        upsert: true,
        new: true,
      },
    );

    console.log(`Saved: ${chapter}`);
  } catch (err) {
    console.log(`Error processing ${chapter}:`, err.message);
  }
}

// ✅ SCAN FOLDERS
async function scanFolders() {
  console.log("Scanning uploads folder...");

  const classes = fs.readdirSync(uploadsDir);

  for (const classFolder of classes) {
    const classPath = path.join(uploadsDir, classFolder);

    if (!fs.statSync(classPath).isDirectory()) continue;

    console.log(`Class: ${classFolder}`);

    const subjects = fs.readdirSync(classPath);

    for (const subjectFolder of subjects) {
      const subjectPath = path.join(classPath, subjectFolder);

      if (!fs.statSync(subjectPath).isDirectory()) continue;

      console.log(`Subject: ${subjectFolder}`);

      const files = fs.readdirSync(subjectPath);

      for (const file of files) {
        if (!file.endsWith(".txt")) continue;

        const filePath = path.join(subjectPath, file);

        const chapter = file.replace(".txt", "").replace(/-/g, " ");

        await processTXT(filePath, classFolder, subjectFolder, chapter);
      }
    }
  }

  console.log("All books processed ✅");

  mongoose.connection.close();
}

scanFolders();
