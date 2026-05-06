import Result from "../models/Result.js";

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const results = await Result.find({ userId });

    const total = results.length;

    const avgScore = results.reduce((a, b) => a + b.score, 0) / (total || 1);

    // Weak topics aggregation
    const weakMap = {};

    results.forEach((r) => {
      r.weakTopics.forEach((t) => {
        weakMap[t] = (weakMap[t] || 0) + 1;
      });
    });

    res.json({
      total,
      avgScore,
      weakTopics: Object.keys(weakMap),
      history: results,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
