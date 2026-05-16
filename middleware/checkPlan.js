export const checkQuizLimit = async (req, res, next) => {
  try {
    console.log("CHECKPLAN USER:", req.user);

    // ✅ USER CHECK
    if (!req.user) {
      return res.status(401).json({
        msg: "User missing in request",
      });
    }

    const user = req.user;

    // ✅ PRO USERS
    if (user.plan === "pro") {
      return next();
    }

    // ✅ RESET DAILY COUNT
    const today = new Date();

    const lastDate = new Date(user.lastQuizDate);

    const isNewDay = today.toDateString() !== lastDate.toDateString();

    if (isNewDay) {
      user.quizCountToday = 0;

      user.lastQuizDate = today;

      await user.save();
    }

    // ✅ FREE LIMIT
    if (user.quizCountToday >= 3) {
      return res.status(403).json({
        premiumRequired: true,

        msg: "Daily free quiz limit reached",
      });
    }

    next();
  } catch (err) {
    console.log("CHECKPLAN ERROR:", err.message);

    res.status(500).json({
      msg: "Plan check failed",
    });
  }
};
