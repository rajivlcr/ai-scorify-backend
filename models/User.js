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

    // 🚀 FREEMIUM
    plan: {
      type: String,

      enum: ["free", "pro"],

      default: "free",
    },

    // 🚀 DAILY QUIZ LIMIT
    quizCountToday: {
      type: Number,

      default: 0,
    },

    // 🚀 RESET DAILY
    lastQuizDate: {
      type: Date,

      default: Date.now,
    },

    // 🚀 SUBSCRIPTION
    subscriptionExpires: {
      type: Date,
    },
  },

  {
    timestamps: true,
  },
);

export default mongoose.model("User", userSchema);
