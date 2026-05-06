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
  },
  { timestamps: true },
);

export default mongoose.model("Result", resultSchema);
