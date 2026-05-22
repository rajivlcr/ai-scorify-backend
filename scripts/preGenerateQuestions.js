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

    target: 150,
  },

  {
    type: "assertion",

    target: 60,
  },

  {
    type: "case-study",

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
      const {
        className,

        subject,

        chapter,

        content,
      } = item;

      console.log("\n====================================");

      console.log(`📘 ${className} | ${subject} | ${chapter}`);

      // 🚀 LOOP TYPES
      for (const config of TYPES) {
        const {
          type,

          target,
        } = config;

        console.log("\n------------------------------------");

        console.log(`🚀 TYPE: ${type}`);

        // 🚀 FIND EXISTING
        let bank = await QuestionBank.findOne({
          className,

          subject,

          chapter,

          type,
        });

        // 🚀 CREATE EMPTY
        if (!bank) {
          bank = await QuestionBank.create({
            className,

            subject,

            chapter,

            type,

            questions: [],
          });
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

            // 🚀 EMPTY
            if (!newQuestions || newQuestions.length === 0) {
              console.log("⚠️ Empty response");

              console.log("⏳ Waiting 20 sec...");

              await sleep(20000);

              continue;
            }

            // 🚀 DUPLICATE FILTER
            const existing = new Set(bank.questions.map((q) => q.question));

            const unique = newQuestions.filter(
              (q) => q.question && !existing.has(q.question),
            );

            // 🚀 APPEND
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
