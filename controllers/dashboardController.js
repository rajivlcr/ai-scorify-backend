// 📁 backend/controllers/dashboardController.js

import Result from "../models/Result.js";
import User from "../models/User.js";
import UserWeakArea from "../models/UserWeakArea.js";

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🚀 USER
    const user = await User.findById(userId);

    // 🚀 RESULTS
    const results = await Result.find({
      userId,
    }).sort({
      createdAt: -1,
    });

    // 🚀 TOTAL QUIZZES
    const total = results.length;

    // 🚀 AVERAGE SCORE
    const avgScore =
      results.reduce((sum, item) => sum + (item.score || 0), 0) / (total || 1);

    // 🚀 AVERAGE ACCURACY
    const avgAccuracy =
      results.reduce((sum, item) => sum + (item.accuracy || 0), 0) /
      (total || 1);

    // 🚀 RECENT ACTIVITY
    const recent = results.slice(0, 5);

    // 🚀 WEAK TOPICS (LEGACY)
    const weakMap = {};

    results.forEach((r) => {
      r.weakTopics?.forEach((topic) => {
        weakMap[topic] = (weakMap[topic] || 0) + 1;
      });
    });

    // 🚀 FOCUS AREAS
    const focusAreas = await UserWeakArea.find({
      userId,
    })
      .sort({
        wrongCount: -1,
      })
      .limit(5);

    // 🚀 CHAPTER COMPLETION
    const chapterMap = {};

    results.forEach((r) => {
      if (!r.chapter) return;

      if (!chapterMap[r.chapter]) {
        chapterMap[r.chapter] = {
          chapter: r.chapter,
          attempts: 0,
          accuracy: 0,
        };
      }

      chapterMap[r.chapter].attempts += 1;

      chapterMap[r.chapter].accuracy += r.accuracy || 0;
    });

    const chapterProgress = Object.values(chapterMap).map((c) => ({
      chapter: c.chapter,

      attempts: c.attempts,

      completion: Math.min(c.attempts * 20, 100),

      accuracy: Math.round(c.accuracy / c.attempts),
    }));

    // 🚀 MASTERED CHAPTERS
    const masteredChapters = chapterProgress.filter(
      (c) => c.completion >= 100 && c.accuracy >= 80,
    );

    // 🚀 STUDY RECOMMENDATIONS
    const recommendations = [];

    focusAreas.slice(0, 3).forEach((area) => {
      recommendations.push({
        title: area.learningObjective || area.chapter,
        chapter: area.chapter,
        priority: area.wrongCount,
      });
    });

    // 🚀 RANK
    const higherUsers = await User.countDocuments({
      xp: {
        $gt: user.xp,
      },
    });

    const rank = higherUsers + 1;

    // 🚀 ACHIEVEMENTS
    const achievements = [];

    if (user.streak >= 3) {
      achievements.push({
        emoji: "🔥",
        title: "3 Day Streak",
        desc: "Practice continuously for 3 days",
      });
    }

    if (user.xp >= 100) {
      achievements.push({
        emoji: "⚡",
        title: "100 XP Club",
        desc: "Earned 100 XP points",
      });
    }

    if (avgScore >= 90 && total >= 5) {
      achievements.push({
        emoji: "🏆",
        title: "Quiz Master",
        desc: "Average score above 90%",
      });
    }

    if (masteredChapters.length >= 3) {
      achievements.push({
        emoji: "🎓",
        title: "Chapter Master",
        desc: "Mastered 3 chapters",
      });
    }

    // 🚀 RESPONSE
    res.json({
      total,

      avgScore: Math.round(avgScore),

      avgAccuracy: Math.round(avgAccuracy),

      weakTopics: Object.keys(weakMap),

      focusAreas,

      chapterProgress,

      masteredChapters,

      recommendations,

      history: results,

      recent,

      rank,

      achievements,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Dashboard failed",
    });
  }
};
