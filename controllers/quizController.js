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
  const { className, subject, chapter, type } = req.body;

  try {
    const normalizedSubject = normalize(subject);

    const normalizedChapter = normalize(chapter);

    // 🚀 USER
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // 🚀 PREMIUM LOCK
    if (user.plan?.toLowerCase() === "free" && type !== "mcq") {
      return res.status(403).json({
        premiumRequired: true,

        msg: "Upgrade to PRO",
      });
    }

    // 🚀 FREE PLAN DAILY LIMIT
    if (user.plan?.toLowerCase() === "free") {
      const today = new Date().toDateString();

      const lastDate = user.lastQuizDate
        ? new Date(user.lastQuizDate).toDateString()
        : null;

      // 🚀 RESET COUNT
      if (today !== lastDate) {
        user.quizCountToday = 0;

        user.lastQuizDate = new Date();
      }

      // 🚀 LIMIT
      if (user.quizCountToday >= 5) {
        return res.status(403).json({
          premiumRequired: true,

          msg: "Daily free limit reached",
        });
      }

      // 🚀 INCREMENT
      user.quizCountToday += 1;

      await user.save();
    }

    // 🚀 CHECK CACHE
    let data = await QuestionBank.findOne({
      className,

      subject: normalizedSubject,

      chapter: normalizedChapter,

      type,
    });

    // 🚀 QUESTION LIMIT
    const limit = type === "mcq" ? 15 : type === "assertion" ? 10 : 2;

    // 🚀 RETURN RANDOM QUESTIONS
    if (data && data.questions.length > 0) {
      const shuffled = [...data.questions].sort(() => 0.5 - Math.random());

      return res.json({
        questions: shuffled.slice(0, limit),

        cached: true,

        user,
      });
    }

    console.log("🚀 Generating new pool...");

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

    // 🚀 GENERATE QUESTIONS
    const questions = await generateAIQuiz(
      normalizedSubject,

      normalizedChapter,

      chapterData.content,

      type,
    );

    if (!questions || questions.length === 0) {
      return res.status(500).json({
        msg: "AI failed to generate questions",
      });
    }

    // 🚀 SAVE TO DB
    await QuestionBank.create({
      className,

      subject: normalizedSubject,

      chapter: normalizedChapter,

      type,

      questions,
    });

    // 🚀 RANDOMIZE
    const shuffled = [...questions].sort(() => 0.5 - Math.random());

    res.json({
      questions: shuffled.slice(0, limit),

      cached: false,

      user,
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
    const { userId, subject, chapter, quiz, answers } = req.body;

    let score = 0;

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

    // 🚀 XP
    let earnedXP = 10;

    const accuracy = (score / quiz.length) * 100;

    if (accuracy >= 80) {
      earnedXP += 5;
    }

    user.xp += earnedXP;

    console.log("XP UPDATED:", user.xp);

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

    console.log("USER SAVED");

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
