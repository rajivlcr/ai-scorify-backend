import QuestionBank from "../models/QuestionBank.js";
import Result from "../models/Result.js";
import BookContent from "../models/BookContent.js";

import { generateAIQuiz } from "../services/aiService.js";

// ✅ DELAY HELPER
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ✅ NORMALIZE HELPER
const normalize = (text) =>
  text?.toLowerCase()?.trim()?.replace("mathematics", "maths");

// 🔥 GENERATE QUIZ
export const generateQuiz = async (req, res) => {
  const { subject, chapter } = req.body;

  try {
    const normalizedSubject = normalize(subject);

    const normalizedChapter = normalize(chapter);

    console.log({
      subject: normalizedSubject,

      chapter: normalizedChapter,
    });

    let data = await QuestionBank.findOne({
      subject: normalizedSubject,

      chapter: normalizedChapter,
    });

    // ✅ RETURN RANDOM EXISTING VARIANT
    if (data && data.variants.length > 0) {
      const random = Math.floor(Math.random() * data.variants.length);

      return res.json(data.variants[random].questions);
    }

    console.log("🚀 Generating first quiz variant...");

    // ✅ FETCH NCERT CONTENT
    const chapterData = await BookContent.findOne({
      subject: normalizedSubject,

      chapter: normalizedChapter,
    });

    if (!chapterData) {
      return res.status(404).json({
        msg: "NCERT chapter content not found",
      });
    }

    // ✅ GENERATE FIRST VARIANT
    const questions = await generateAIQuiz(
      normalizedSubject,
      normalizedChapter,
      chapterData.content,
      20,
    );

    const variants = [
      {
        questions,
      },
    ];

    // ✅ SAVE INITIAL VARIANT
    data = await QuestionBank.create({
      subject: normalizedSubject,

      chapter: normalizedChapter,

      variants,
    });

    // ✅ SEND QUIZ IMMEDIATELY
    res.json(questions);

    // 🔥 GENERATE REMAINING VARIANTS
    generateRemainingVariants(
      normalizedSubject,
      normalizedChapter,
      chapterData.content,
    );
  } catch (err) {
    console.error("QUIZ ERROR:", err);

    res.status(500).json({
      msg: err.message || "Quiz generation failed",
    });
  }
};

// 🔥 BACKGROUND VARIANTS
async function generateRemainingVariants(subject, chapter, chapterContent) {
  try {
    console.log("⚡ Generating background variants...");

    let extraVariants = [];

    for (let i = 0; i < 2; i++) {
      try {
        // ✅ WAIT BEFORE NEXT CALL
        if (i > 0) {
          console.log("⏳ Waiting before next variant...");

          await delay(12000);
        }

        const questions = await generateAIQuiz(
          subject,
          chapter,
          chapterContent,
          20,
        );

        extraVariants.push({
          questions,
        });

        console.log(`✅ Background variant ${i + 2} generated`);
      } catch (err) {
        console.log("❌ Background variant failed:", err.message);
      }
    }

    // ✅ UPDATE DB
    await QuestionBank.findOneAndUpdate(
      {
        subject,
        chapter,
      },
      {
        $push: {
          variants: {
            $each: extraVariants,
          },
        },
      },
    );

    console.log("✅ Background variants saved");
  } catch (err) {
    console.log("❌ Background generation error:", err.message);
  }
}

// 🔥 SUBMIT QUIZ
export const submitQuiz = async (req, res) => {
  try {
    const { userId, subject, chapter, quiz, answers } = req.body;

    let score = 0;

    quiz.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        score++;
      }
    });

    await Result.create({
      userId,

      subject: normalize(subject),

      chapter: normalize(chapter),

      score,

      total: quiz.length,
    });

    res.json({
      score,
      total: quiz.length,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Submit failed",
    });
  }
};
