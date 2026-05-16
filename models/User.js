import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,

      required: true,
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
