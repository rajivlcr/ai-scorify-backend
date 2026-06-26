import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,

      required: true,
    },

    role: {
      type: String,
      default: "user",
    },

    email: {
      type: String,

      required: true,

      unique: true,
    },

    password: {
      type: String,

      required: true,
    },

    // 🚀 PLAN
    plan: {
      type: String,

      enum: ["free", "pro"],

      default: "free",
    },

    // 🚀 QUIZ LIMIT
    quizCountToday: {
      type: Number,

      default: 0,
    },

    lastQuizDate: {
      type: Date,

      default: Date.now,
    },

    // 🚀 SUBSCRIPTION
    subscriptionExpires: {
      type: Date,
    },

    // 🚀 XP SYSTEM
    xp: {
      type: Number,

      default: 0,
    },

    planExpiresAt: {
      type: Date,
    },

    // 🚀 FREE PLAN CHAPTER ACCESS
    unlockedChapters: {
      type: [String],
      default: [],
    },

    // 🚀 STREAK SYSTEM
    streak: {
      type: Number,

      default: 0,
    },

    lastActiveDate: {
      type: Date,
    },
  },

  {
    timestamps: true,
  },
);

export default mongoose.model("User", userSchema);
