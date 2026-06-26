import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["mcq", "assertion"],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "concept",
        "application",
        "competency",
        "hots",
        "numerical",
        "assertion",
      ],
      default: "concept",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    learningObjective: {
      type: String,
      default: "",
    },

    question: {
      type: String,
      required: true,
    },

    options: {
      type: [String],
      default: [],
    },

    correctAnswer: {
      type: String,
      required: true,
    },

    explanation: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const questionBankV2Schema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      index: true,
    },

    subject: {
      type: String,
      required: true,
      index: true,
    },

    chapter: {
      type: String,
      required: true,
      index: true,
    },

    questions: {
      type: [questionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

questionBankV2Schema.index({
  className: 1,
  subject: 1,
  chapter: 1,
});

export default mongoose.model("QuestionBankV2", questionBankV2Schema);
