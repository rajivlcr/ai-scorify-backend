import mongoose from "mongoose";

const userWeakAreaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    subject: {
      type: String,
      required: true,
    },

    chapter: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "concept",
    },

    learningObjective: {
      type: String,
      default: "",
    },

    wrongCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

userWeakAreaSchema.index({
  userId: 1,
  chapter: 1,
  learningObjective: 1,
});

export default mongoose.model("UserWeakArea", userWeakAreaSchema);
