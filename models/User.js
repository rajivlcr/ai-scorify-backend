import mongoose from "mongoose";

export default mongoose.model("User", {
  name: String,
  email: { type: String, unique: true },
  password: String,
});
