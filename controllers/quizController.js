import QuestionBank from "../models/QuestionBank.js";

import Result from "../models/Result.js";

import BookContent from "../models/BookContent.js";

import User from "../models/User.js";

import { generateAIQuiz } from "../services/aiService.js";

// 🚀 NORMALIZE
const normalize = (text) =>
  text?.toLowerCase()?.trim()?.replace("mathematics", "maths");

// 🚀 GENERATE QUIZ
export const generateQuiz = async (req, res) => {
  const {
    className,

    subject,

    chapter,

    type,
  } = req.body;

  try {
    const normalizedSubject = normalize(subject);

    const normalizedChapter = normalize(chapter);

    // 🚀 FREE PLAN LIMIT
    if (req.user.plan === "free" && type !== "mcq") {
      return res.status(403).json({
        premiumRequired: true,

        msg: "Upgrade to Pro",
      });
    }

    // 🚀 GET CHAPTER
    const chapterData = await BookContent.findOne({
      className,

      subject: normalizedSubject,

      chapter: normalizedChapter,
    });

    if (!chapterData) {
      return res.status(404).json({
        msg: "Chapter not found",
      });
    }

    // 🚀 CHECK CACHE
    let data = await QuestionBank.findOne({
      className,

      subject: normalizedSubject,

      chapter: normalizedChapter,

      type,
    });

    // 🚀 EXISTING POOL
    if (data && data.questions.length > 0) {
      // 🚀 AUTO EXPAND
      if (data.questions.length < 100) {
        console.log("🚀 Expanding question pool...");

        try {
          const newQuestions = await generateAIQuiz(
            normalizedSubject,

            normalizedChapter,

            chapterData.content,

            type,
          );

          // 🚀 REMOVE DUPLICATES
          const existing = new Set(data.questions.map((q) => q.question));

          const uniqueQuestions = newQuestions.filter(
            (q) => !existing.has(q.question),
          );

          // 🚀 APPEND
          data.questions.push(...uniqueQuestions);

          // 🚀 SAVE
          await data.save();

          console.log(`✅ Added ${uniqueQuestions.length} new questions`);
        } catch (err) {
          console.log("❌ Pool expansion failed:", err.message);
        }
      }

      // 🚀 RANDOMIZE
      const shuffled = [...data.questions].sort(() => 0.5 - Math.random());

      const limit = type === "mcq" ? 15 : type === "assertion" ? 10 : 2;

      return res.json({
        questions: shuffled.slice(0, limit),

        cached: true,
      });
    }

    // 🚀 FIRST GENERATION
    console.log("🚀 Generating new pool...");

    const questions = await generateAIQuiz(
      normalizedSubject,

      normalizedChapter,

      chapterData.content,

      type,
    );

    // 🚀 SAVE TO DB
    data = await QuestionBank.create({
      className,

      subject: normalizedSubject,

      chapter: normalizedChapter,

      type,

      questions,
    });

    // 🚀 RANDOMIZE
    const shuffled = [...data.questions].sort(() => 0.5 - Math.random());

    const limit = type === "mcq" ? 15 : type === "assertion" ? 10 : 2;

    res.json({
      questions: shuffled.slice(0, limit),

      cached: false,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Quiz generation failed",
    });
  }
};

// 🚀 SUBMIT QUIZ
export const submitQuiz = async (req, res) => {
  try {
    const { userId, subject, chapter, quiz = [], answers = [] } = req.body;

    // 🚀 VALIDATION
    if (!userId || !quiz.length || !answers.length) {
      return res.status(400).json({
        msg: "Quiz data missing",
      });
    }

    let score = 0;

    // 🚀 SCORE
    quiz.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        score++;
      }
    });

    // 🚀 SAVE RESULT
    await Result.create({
      userId,
      subject: normalize(subject),
      chapter: normalize(chapter),
      score,
      total: quiz.length,
    });

    // 🚀 USER
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // 🚀 XP
    let earnedXP = 10;

    const accuracy = (score / quiz.length) * 100;

    if (accuracy >= 80) {
      earnedXP += 5;
    }

    user.xp += earnedXP;

    // 🚀 STREAK
    const today = new Date();

    const lastActive = user.lastActiveDate
      ? new Date(user.lastActiveDate)
      : null;

    if (!lastActive) {
      user.streak = 1;
    } else {
      const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.streak += 1;
      } else if (diffDays > 1) {
        user.streak = 1;
      }
    }

    user.lastActiveDate = today;

    await user.save();

    // 🚀 RESPONSE
    res.json({
      score,
      total: quiz.length,
      earnedXP,
      streak: user.streak,
      totalXP: user.xp,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Submit failed",
    });
  }
};
