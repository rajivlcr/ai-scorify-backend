import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  type: String,

  question: String,

  assertion: String,

  reason: String,

  options: [String],

  correctAnswer: String,
});

const questionBankSchema = new mongoose.Schema(
  {
    subject: String,

    chapter: String,

    type: String,

    questions: [questionSchema],

    createdAt: {
      type: Date,

      default: Date.now,

      expires: 604800,
    },
  },

  {
    timestamps: true,
  },
);

export default mongoose.model(
  "QuestionBank",

  questionBankSchema,
);
