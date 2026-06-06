import dotenv from "dotenv";

import mongoose from "mongoose";

import BookContent from "../models/BookContent.js";

import QuestionBank from "../models/QuestionBank.js";

import { generateAIQuiz } from "../services/aiService.js";

dotenv.config();

// 🚀 CONNECT DB
await mongoose.connect(process.env.MONGO_URI);

console.log("✅ MongoDB Connected");

// 🚀 CONFIG
const TYPES = [
  {
    type: "mcq",
    target: 60,
  },

  {
    type: "assertion",
    target: 30,
  },
];

// 🚀 SLEEP
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 🚀 GENERATE
async function generatePools() {
  try {
    // 🚀 GET ALL CHAPTERS
    const chapters = await BookContent.find();

    console.log(`📚 Found ${chapters.length} chapters`);

    // 🚀 LOOP CHAPTERS
    for (const item of chapters) {
      const { className, subject, chapter, content } = item;

      console.log("\n====================================");

      console.log(`📘 ${className} | ${subject} | ${chapter}`);

      // 🚀 LOOP TYPES
      for (const config of TYPES) {
        const { type, target } = config;

        console.log("\n------------------------------------");

        console.log(`🚀 TYPE: ${type}`);

        // 🚀 FIND EXISTING
        let bank = await QuestionBank.findOne({
          className,
          subject,
          chapter,
          type,
        });

        // 🚀 CREATE ONLY IF NOT EXISTS
        if (!bank) {
          bank = await QuestionBank.create({
            className,
            subject,
            chapter,
            type,
            questions: [],
          });

          console.log("🆕 Created new QuestionBank");
        }

        // 🚀 SAFETY
        if (!Array.isArray(bank.questions)) {
          bank.questions = [];
        }

        console.log(`📦 Existing: ${bank.questions.length}/${target}`);

        // 🚀 GENERATE UNTIL TARGET
        while (bank.questions.length < target) {
          try {
            console.log("\n🤖 Generating batch...");

            const newQuestions = await generateAIQuiz(
              subject,
              chapter,
              content,
              type,
            );

            // 🚀 DEBUG
            console.log(`📥 Received ${newQuestions?.length || 0} questions`);

            // 🚀 EMPTY RESPONSE
            if (!newQuestions || newQuestions.length === 0) {
              console.log("⚠️ Empty AI response");

              console.log("⏳ Waiting 20 sec...");

              await sleep(20000);

              continue;
            }

            // 🚀 EXISTING QUESTIONS
            const existingQuestions = new Set(
              bank.questions.map((q) => q.question?.trim()),
            );

            // 🚀 FILTER VALID + UNIQUE
            const unique = newQuestions.filter((q) => {
              if (!q || !q.question || !q.correctAnswer) {
                return false;
              }

              return !existingQuestions.has(q.question.trim());
            });

            // 🚀 SAFETY
            if (unique.length === 0) {
              console.log("⚠️ No unique questions");

              console.log("⏳ Waiting 15 sec...");

              await sleep(15000);

              continue;
            }

            // 🚀 APPEND ONLY
            bank.questions.push(...unique);

            // 🚀 SAVE
            await bank.save();

            console.log(`✅ Added ${unique.length}`);

            console.log(`📦 Pool: ${bank.questions.length}/${target}`);

            // 🚀 FREE TIER SAFE
            console.log("⏳ Cooling 25 sec...");

            await sleep(25000);
          } catch (err) {
            console.log("\n❌ GENERATION FAILED");

            console.log(err.message);

            // 🚀 RATE LIMIT
            if (err?.status === 429) {
              console.log("🚦 Rate limit reached");

              console.log("⏳ Waiting 60 sec...");

              await sleep(60000);
            } else {
              console.log("⏳ Waiting 30 sec...");

              await sleep(30000);
            }
          }
        }

        console.log(`🎉 ${type} completed`);
      }
    }

    console.log("\n🚀 ALL POOLS GENERATED SUCCESSFULLY");

    process.exit();
  } catch (err) {
    console.log(err);

    process.exit(1);
  }
}

// 🚀 START
generatePools();
