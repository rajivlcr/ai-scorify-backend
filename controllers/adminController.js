import User from "../models/User.js";

import Result from "../models/Result.js";

import QuestionBank from "../models/QuestionBank.js";

// 🚀 DASHBOARD STATS
export const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const proUsers = await User.countDocuments({
      plan: "pro",
    });

    const totalQuizzes = await Result.countDocuments();

    const totalRevenue = proUsers * 199;

    res.json({
      totalUsers,

      proUsers,

      totalQuizzes,

      totalRevenue,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Failed to load stats",
    });
  }
};

// 🚀 GET USERS
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()

      .sort({
        createdAt: -1,
      })

      .select("-password");

    res.json(users);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Failed to load users",
    });
  }
};

// 🚀 UPDATE PLAN
export const updatePlan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    user.plan = req.body.plan;

    if (req.body.plan === "pro") {
      const expiry = new Date();

      expiry.setDate(expiry.getDate() + 30);

      user.planExpiresAt = expiry;
    } else {
      user.planExpiresAt = null;
    }

    await user.save();

    res.json({
      msg: "Plan updated",

      user,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Update failed",
    });
  }
};

// 🚀 DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // 🚀 PREVENT SELF DELETE
    if (user.role === "admin") {
      return res.status(400).json({
        msg: "Admin cannot be deleted",
      });
    }

    // 🚀 DELETE RESULTS
    await Result.deleteMany({
      userId: user._id,
    });

    // 🚀 DELETE USER
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,

      msg: "User deleted",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Delete failed",
    });
  }
};
