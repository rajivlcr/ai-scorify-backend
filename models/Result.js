import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    subject: String,

    chapter: String,

    score: Number,

    total: Number,

    accuracy: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Result", resultSchema);
