// 📁 backend/controllers/quizController.js

import QuestionBankV2 from "../models/QuestionBankV2.js";
import Result from "../models/Result.js";
import BookContent from "../models/BookContent.js";
import User from "../models/User.js";
import UserWeakArea from "../models/UserWeakArea.js";

// 🚀 NORMALIZE
const normalize = (text) =>
  text?.toLowerCase()?.trim()?.replace("mathematics", "maths");

// 🚀 GENERATE NORMAL QUIZ
export const generateQuiz = async (req, res) => {
  const { className, subject, chapter, type } = req.body;

  try {
    const normalizedSubject = normalize(subject);
    const normalizedChapter = normalize(chapter);

    // 🚀 FREE USER CHAPTER LIMIT
    if (req.user && req.user.plan === "free") {
      const alreadyUnlocked =
        req.user.unlockedChapters?.includes(normalizedChapter);

      if (!alreadyUnlocked && req.user.unlockedChapters.length >= 5) {
        return res.status(403).json({
          premiumRequired: true,
          msg: "Free plan includes access to 5 chapters only. Upgrade to Pro.",
        });
      }

      if (!alreadyUnlocked) {
        req.user.unlockedChapters.push(normalizedChapter);
        await req.user.save();
      }
    }

    // 🚀 FREE USERS ONLY MCQ
    if (req.user && req.user.plan === "free" && type !== "mcq") {
      return res.status(403).json({
        premiumRequired: true,
        msg: "Upgrade to Pro",
      });
    }

    // 🚀 GUESTS ONLY MCQ
    if (!req.user && type !== "mcq") {
      return res.status(403).json({
        premiumRequired: true,
        msg: "Please register to unlock this quiz type",
      });
    }

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

    const data = await QuestionBankV2.findOne({
      className,
      subject: normalizedSubject,
      chapter: normalizedChapter,
    });

    if (!data || !data.questions?.length) {
      return res.status(404).json({
        msg: "Question pool not available",
      });
    }

    const pool = data.questions.filter((q) => q.type === type);

    if (!pool.length) {
      return res.status(404).json({
        msg: `${type} questions not available`,
      });
    }

    let selectedQuestions = [];

    if (type === "mcq") {
      const concept = pool
        .filter((q) => q.category === "concept")
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const application = pool
        .filter((q) => q.category === "application")
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const competency = pool
        .filter((q) => q.category === "competency")
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const hots = pool
        .filter((q) => q.category === "hots")
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const numerical = pool
        .filter((q) => q.category === "numerical")
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      selectedQuestions = [
        ...concept,
        ...application,
        ...competency,
        ...hots,
        ...numerical,
      ];
    } else {
      selectedQuestions = pool.sort(() => Math.random() - 0.5).slice(0, 10);
    }

    selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);

    res.json({
      questions: selectedQuestions,
      cached: true,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Quiz fetch failed",
    });
  }
};

// 🚀 REVISION QUIZ
export const generateRevisionQuiz = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        msg: "Login required",
      });
    }

    const weakAreas = await UserWeakArea.find({
      userId: req.user._id,
    })
      .sort({ wrongCount: -1 })
      .limit(10);

    if (!weakAreas.length) {
      return res.status(404).json({
        msg: "No weak areas found yet",
      });
    }

    const questions = [];

    for (const area of weakAreas) {
      const bank = await QuestionBankV2.findOne({
        subject: area.subject,
        chapter: area.chapter,
      });

      if (!bank) continue;

      const matchingQuestions = bank.questions.filter(
        (q) =>
          q.type === "mcq" &&
          (q.learningObjective === area.learningObjective ||
            q.category === area.category),
      );

      questions.push(
        ...matchingQuestions.sort(() => Math.random() - 0.5).slice(0, 2),
      );
    }

    const finalQuestions = questions
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    if (!finalQuestions.length) {
      return res.status(404).json({
        msg: "Revision questions unavailable",
      });
    }

    res.json({
      revision: true,
      questions: finalQuestions,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Revision quiz failed",
    });
  }
};

// 🚀 SUBMIT QUIZ
export const submitQuiz = async (req, res) => {
  try {
    const { userId, subject, chapter, quiz = [], answers = [] } = req.body;

    if (!quiz.length || !answers.length) {
      return res.status(400).json({
        msg: "Quiz data missing",
      });
    }

    const isGuest = !userId;

    let score = 0;

    const wrongQuestions = [];

    quiz.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        score++;
      } else {
        wrongQuestions.push(q);
      }
    });

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

    const accuracy = Math.round((score / quiz.length) * 100);

    await Result.create({
      userId,
      subject: normalize(subject),
      chapter: normalize(chapter),
      score,
      total: quiz.length,
      accuracy,
    });

    for (const q of wrongQuestions) {
      await UserWeakArea.findOneAndUpdate(
        {
          userId,
          chapter: normalize(chapter),
          learningObjective: q.learningObjective || "",
        },
        {
          $inc: {
            wrongCount: 1,
          },
          $set: {
            subject: normalize(subject),
            category: q.category || "concept",
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        },
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    let earnedXP = 10;

    if (accuracy >= 80) {
      earnedXP += 5;
    }

    user.xp += earnedXP;

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
