import User from "../models/User.js";
import Result from "../models/Result.js";
import QuestionBankV2 from "../models/QuestionBankV2.js";

// 🚀 DASHBOARD STATS
export const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const proUsers = await User.countDocuments({
      plan: "pro",
    });

    const totalQuizzes = await Result.countDocuments();

    const totalRevenue = proUsers * 199;

    const questionBanks = await QuestionBankV2.countDocuments();

    const questionStats = await QuestionBankV2.aggregate([
      {
        $project: {
          count: {
            $size: "$questions",
          },
        },
      },
    ]);

    const totalQuestions = questionStats.reduce(
      (sum, item) => sum + item.count,
      0,
    );

    res.json({
      totalUsers,
      proUsers,
      totalQuizzes,
      totalRevenue,
      questionBanks,
      totalQuestions,
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

    if (user.role === "admin") {
      return res.status(400).json({
        msg: "Admin cannot be deleted",
      });
    }

    await Result.deleteMany({
      userId: user._id,
    });

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

export const getQuestionBanks = async (req, res) => {
  try {
    const banks = await QuestionBankV2.find();

    const formatted = banks.map((bank) => ({
      _id: bank._id,
      className: bank.className,
      subject: bank.subject,
      chapter: bank.chapter,
      totalQuestions: bank.questions.length,

      mcqCount: bank.questions.filter((q) => q.type === "mcq").length,

      assertionCount: bank.questions.filter((q) => q.type === "assertion")
        .length,
    }));

    res.json(formatted);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Failed to load question banks",
    });
  }
};

export const getQuestionBank = async (req, res) => {
  try {
    const bank = await QuestionBankV2.findById(req.params.id);

    if (!bank) {
      return res.status(404).json({
        msg: "Question bank not found",
      });
    }

    res.json(bank);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Failed to load question bank",
    });
  }
};
