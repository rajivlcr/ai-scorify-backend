import User from "../models/User.js";

// 🚀 GET LEADERBOARD
export const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find()

      .sort({
        xp: -1,
      })

      .limit(10)

      .select("name xp streak plan");

    console.log("LEADERBOARD USERS:", users.length);

    res.json(users);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Leaderboard failed",
    });
  }
};
