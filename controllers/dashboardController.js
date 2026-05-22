import Result from "../models/Result.js";

import User from "../models/User.js";

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🚀 USER
    const user = await User.findById(userId);

    // 🚀 RESULTS
    const results = await Result.find({
      userId,
    })

      .sort({
        createdAt: -1,
      });

    // 🚀 TOTAL QUIZZES
    const total = results.length;

    // 🚀 AVG SCORE
    const avgScore =
      results.reduce(
        (a, b) => a + b.score,

        0,
      ) / (total || 1);

    // 🚀 WEAK TOPICS
    const weakMap = {};

    results.forEach((r) => {
      r.weakTopics?.forEach((t) => {
        weakMap[t] = (weakMap[t] || 0) + 1;
      });
    });

    // 🚀 RECENT ACTIVITY
    const recent = results.slice(0, 5);

    // 🚀 RANK
    const higherUsers = await User.countDocuments({
      xp: {
        $gt: user.xp,
      },
    });

    const rank = higherUsers + 1;

    // 🚀 ACHIEVEMENTS
    const achievements = [];

    // 🚀 STREAK
    if (user.streak >= 3) {
      achievements.push({
        emoji: "🔥",

        title: "3 Day Streak",

        desc: "Practice continuously for 3 days",
      });
    }

    // 🚀 XP
    if (user.xp >= 100) {
      achievements.push({
        emoji: "⚡",

        title: "100 XP Club",

        desc: "Earned 100 XP points",
      });
    }

    // 🚀 QUIZ MASTER
    if (avgScore >= 90 && total >= 5) {
      achievements.push({
        emoji: "🏆",

        title: "Quiz Master",

        desc: "Average score above 90%",
      });
    }

    res.json({
      total,

      avgScore,

      weakTopics: Object.keys(weakMap),

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
