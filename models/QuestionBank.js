import mongoose from "mongoose";

const questionBankSchema = new mongoose.Schema(
  {
    subject: String,
    chapter: String,

    variants: [
      {
        questions: Array,
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("QuestionBank", questionBankSchema);
