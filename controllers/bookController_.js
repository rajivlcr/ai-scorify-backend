import fs from "fs";
import pdf from "pdf-parse";
import BookContent from "../models/BookContent.js";

export const uploadBook = async (req, res) => {
  try {
    const filePath = req.file.path;

    const dataBuffer = fs.readFileSync(filePath);

    const pdfData = await pdf(dataBuffer);

    const extractedText = pdfData.text;

    // TEMP save as one chapter
    const saved = await BookContent.create({
      subject: req.body.subject,
      class: req.body.class,
      chapter: req.body.chapter,
      content: extractedText,
    });

    res.json({
      success: true,
      message: "PDF uploaded & parsed",
      id: saved._id,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
