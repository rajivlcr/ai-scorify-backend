import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: String,
  class: String,
  chapters: [
    {
      name: String,
      topics: [String],
    },
  ],
});

export default mongoose.model("Subject", schema);
