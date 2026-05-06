import dotenv from "dotenv";
import mongoose from "mongoose";
import Subject from "../models/Subject.js";
import syllabus from "./syllabus.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI, {
  tlsAllowInvalidCertificates: true,
});

await Subject.deleteMany();
await Subject.insertMany(syllabus);

console.log("Syllabus seeded successfully ✅");

process.exit();
