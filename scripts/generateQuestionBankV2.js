import dotenv from "dotenv";
import mongoose from "mongoose";
import Groq from "groq-sdk";

import BookContent from "../models/BookContent.js";
import QuestionBankV2 from "../models/QuestionBankV2.js";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

await mongoose.connect(process.env.MONGO_URI);

console.log("✅ MongoDB Connected");

const SUBJECTS = ["science", "maths"];

const TYPES = [
  {
    type: "mcq",
    target: 100,
  },
  {
    type: "assertion",
    target: 25,
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function extractJSON(text) {
  try {
    if (!text || typeof text !== "string") {
      return [];
    }

    const match = text.match(/\[[\s\S]*\]/);

    if (!match) {
      console.log("⚠️ JSON array not found");
      return [];
    }

    let jsonText = match[0];

    // Fix invalid control characters
    jsonText = jsonText.replace(/[\u0000-\u0019]+/g, " ");

    return JSON.parse(jsonText);
  } catch (err) {
    console.log("⚠️ JSON Parse Error:", err.message);

    return [];
  }
}

function normalizeQuestion(text) {
  return text
    ?.toLowerCase()
    ?.replace(/[^a-z0-9 ]/g, "")
    ?.replace(/\s+/g, " ")
    ?.trim();
}

async function generateBatch(subject, chapter, chapterContent, type) {
  const prompt = `
Generate ${type === "mcq" ? 10 : 5} UNIQUE CBSE Class 10 ${subject} questions.

Chapter:
${chapter}

Content:
${chapterContent}

Rules:

* Follow NCERT
* Follow latest CBSE pattern
* No duplicate concepts
* No repeated wording

category MUST be EXACTLY one of:

* concept
* application
* competency
* hots
* numerical

For assertion questions:

* assertion

difficulty MUST be:

* easy
* medium
* hard

Do NOT use chapter names as category.
Do NOT invent categories.

Return ONLY JSON.

MCQ Format:

[
{
"type":"mcq",
"category":"concept",
"difficulty":"medium",
"learningObjective":"...",
"question":"...",
"options":[
"...",
"...",
"...",
"..."
],
"correctAnswer":"...",
"explanation":"..."
}
]

Assertion Format:

[
{
"type":"assertion",
"category":"assertion",
"difficulty":"medium",
"learningObjective":"...",
"question":"Assertion (A): ... Reason (R): ...",
"options":[
"Both A and R are true and R is the correct explanation of A.",
"Both A and R are true but R is not the correct explanation of A.",
"A is true but R is false.",
"A is false but R is true."
],
"correctAnswer":"..."
}
]

Return ONLY JSON.
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",

    temperature: 0.6,

    max_tokens: 2500,

    messages: [
      {
        role: "system",
        content: "Return ONLY valid JSON array.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = completion.choices?.[0]?.message?.content;

  console.log("\n========================");

  console.log(text);

  console.log("\n========================");

  return extractJSON(text);
}

async function generatePools() {
  try {
    const chapters = await BookContent.find({
      className: "class10",
      subject: {
        $in: SUBJECTS,
      },
    });

    console.log(`📚 Found ${chapters.length} chapters`);

    for (const item of chapters) {
      const { className, subject, chapter, content } = item;

      console.log(`\n📘 ${className} | ${subject} | ${chapter}`);

      let bank = await QuestionBankV2.findOne({
        className,
        subject,
        chapter,
      });

      if (!bank) {
        bank = await QuestionBankV2.create({
          className,
          subject,
          chapter,
          questions: [],
        });

        console.log("🆕 QuestionBankV2 created");
      }

      const existingMcq = bank.questions.filter((q) => q.type === "mcq").length;

      const existingAssertion = bank.questions.filter(
        (q) => q.type === "assertion",
      ).length;

      console.log(`MCQ: ${existingMcq}/100`);

      console.log(`Assertion: ${existingAssertion}/25`);

      for (const config of TYPES) {
        const { type, target } = config;

        while (bank.questions.filter((q) => q.type === type).length < target) {
          console.log(`🤖 Generating ${type} batch`);

          const generated = await generateBatch(
            subject,
            chapter,
            content,
            type,
          );

          console.log("FIRST GENERATED QUESTION:");

          console.log(JSON.stringify(generated?.[0], null, 2));

          if (!generated || generated.length === 0) {
            console.log("⚠️ Empty batch");

            await sleep(10000);

            continue;
          }

          const existingQuestions = new Set(
            bank.questions.map((q) => normalizeQuestion(q.question)),
          );

          const unique = generated.filter((q) => {
            if (!q.question || !q.correctAnswer) {
              return false;
            }

            const normalized = normalizeQuestion(q.question);

            if (existingQuestions.has(normalized)) {
              return false;
            }

            existingQuestions.add(normalized);

            return true;
          });

          if (unique.length === 0) {
            console.log("⚠️ No unique questions");

            await sleep(10000);

            continue;
          }

          const validCategories = [
            "concept",
            "application",
            "competency",
            "hots",
            "numerical",
            "assertion",
          ];

          const validDifficulties = ["easy", "medium", "hard"];

          const cleanedQuestions = unique.map((q) => {
            let category = q.category?.toLowerCase()?.trim() || "";

            if (!validCategories.includes(category)) {
              category = type === "assertion" ? "assertion" : "concept";
            }

            let difficulty = q.difficulty?.toLowerCase()?.trim() || "";

            if (!validDifficulties.includes(difficulty)) {
              difficulty = "medium";
            }

            return {
              type,

              category,

              difficulty,

              learningObjective: q.learningObjective?.trim() || chapter,

              question: q.question?.trim(),

              options: Array.isArray(q.options) ? q.options : [],

              correctAnswer: q.correctAnswer?.trim(),

              explanation: q.explanation?.trim() || "",
            };
          });

          bank.questions.push(...cleanedQuestions);

          await bank.save();

          console.log(`✅ Added ${cleanedQuestions.length}`);

          console.log(
            `📦 Current ${type}: ${
              bank.questions.filter((q) => q.type === type).length
            } / ${target}`,
          );

          await sleep(10000);
        }

        console.log(`🎉 ${type} completed`);
      }

      console.log(`✅ Completed chapter: ${chapter}`);
    }

    console.log("\n🚀 ALL SCIENCE + MATHS CHAPTERS GENERATED");

    process.exit();
  } catch (err) {
    console.log(err);

    process.exit(1);
  }
}

generatePools();
