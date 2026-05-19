import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  className: String,

  subject: String,

  chapter: String,

  content: String,
});

export default mongoose.model(
  "BookContent",

  bookSchema,
);
