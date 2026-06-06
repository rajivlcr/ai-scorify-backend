// 📁 backend/controllers/quizController.js

import QuestionBank from "../models/QuestionBank.js";
import Result from "../models/Result.js";
import BookContent from "../models/BookContent.js";
import User from "../models/User.js";

// 🚀 NORMALIZE
const normalize = (text) =>
  text?.toLowerCase()?.trim()?.replace("mathematics", "maths");

// 🚀 GENERATE QUIZ
export const generateQuiz = async (req, res) => {
  const { className, subject, chapter, type } = req.body;

  try {
    const normalizedSubject = normalize(subject);

    const normalizedChapter = normalize(chapter);

    // 🚀 LOGGED-IN FREE PLAN CHECK
    if (req.user && req.user.plan === "free" && type !== "mcq") {
      return res.status(403).json({
        premiumRequired: true,
        msg: "Upgrade to Pro",
      });
    }

    // 🚀 GUESTS CAN ONLY ACCESS MCQ
    if (!req.user && type !== "mcq") {
      return res.status(403).json({
        premiumRequired: true,
        msg: "Please register to unlock this quiz type",
      });
    }

    // 🚀 CHECK CHAPTER EXISTS
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

    // 🚀 FETCH QUESTION POOL
    const data = await QuestionBank.findOne({
      className,
      subject: normalizedSubject,
      chapter: normalizedChapter,
      type,
    });

    if (!data || !data.questions || data.questions.length === 0) {
      return res.status(404).json({
        msg: "Question pool not available",
      });
    }

    // 🚀 RANDOMIZE
    const shuffled = [...data.questions].sort(() => 0.5 - Math.random());

    // 🚀 LIMIT
    const limit = type === "mcq" ? 15 : type === "assertion" ? 10 : 2;

    res.json({
      questions: shuffled.slice(0, limit),
      cached: true,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Quiz fetch failed",
    });
  }
};

// 🚀 SUBMIT QUIZ
export const submitQuiz = async (req, res) => {
  try {
    const { userId, subject, chapter, quiz = [], answers = [] } = req.body;

    // 🚀 VALIDATION
    if (!quiz.length || !answers.length) {
      return res.status(400).json({
        msg: "Quiz data missing",
      });
    }

    const isGuest = !userId;

    let score = 0;

    // 🚀 SCORE
    quiz.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        score++;
      }
    });

    // 🚀 GUEST USER
    if (isGuest) {
      return res.json({
        score,
        total: quiz.length,
        earnedXP: 0,
        streak: 0,
        totalXP: 0,
        guest: true,
      });
    }

    // 🚀 SAVE RESULT
    await Result.create({
      userId,
      subject: normalize(subject),
      chapter: normalize(chapter),
      score,
      total: quiz.length,
    });

    // 🚀 USER
    const user = await User.findById(userId);

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
      guest: false,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Submit failed",
    });
  }
};
