import Groq from "groq-sdk";

import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 🚀 EXTRACT JSON
function extractJSON(text) {
  try {
    const cleaned = text

      ?.replace(/```json/g, "")

      ?.replace(/```/g, "")

      ?.trim();

    const start = cleaned.indexOf("[");

    const end = cleaned.lastIndexOf("]");

    if (start === -1 || end === -1) {
      return [];
    }

    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    console.log("⚠️ Invalid JSON skipped");

    return [];
  }
}

// 🚀 AI QUIZ GENERATOR
export async function generateAIQuiz(
  subject,

  chapter,

  content,

  type,
) {
  // 🚀 SPLIT CHAPTER
  const chunks = [];

  // 🚀 REDUCED CHUNK SIZE
  const chunkSize = 1200;

  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push({
      text: content.slice(i, i + chunkSize),

      retried: false,
    });
  }

  // 🚀 ONLY 2 CHUNKS
  const limitedChunks = chunks.slice(0, 2);

  let allQuestions = [];

  for (let i = 0; i < limitedChunks.length; i++) {
    try {
      // 🚀 DELAY
      if (i > 0) {
        await new Promise((r) => setTimeout(r, 2000));
      }

      const chunk = limitedChunks[i].text;

      let prompt = "";

      // 🚀 MCQ
      if (type === "mcq") {
        prompt = `

Generate 8 CBSE MCQ questions.

Return ONLY valid JSON array.

Format:

[
  {
    "type":"mcq",

    "question":"...",

    "options":[
      "...",
      "...",
      "...",
      "..."
    ],

    "correctAnswer":"..."
  }
]

Rules:
- STRICT JSON ONLY
- NO markdown
- NO explanation
- NO extra text

Chapter:
${chunk}

`;
      }

      // 🚀 ASSERTION
      else if (type === "assertion") {
        prompt = `

Generate 5 CBSE Assertion and Reason questions.

Return ONLY valid JSON array.

Format:

[
  {
    "type":"assertion",

    "question":"Assertion (A): ... Reason (R): ...",

    "options":[
      "Both A and R are true and R is the correct explanation of A.",
      "Both A and R are true but R is not the correct explanation of A.",
      "A is true but R is false.",
      "A is false but R is true."
    ],

    "correctAnswer":"Both A and R are true and R is the correct explanation of A."
  }
]

Rules:
- STRICT JSON ONLY
- NO markdown
- NO explanation
- NO extra text
- Use ONLY the exact options provided
- Questions must follow CBSE pattern

Chapter:
${chunk}

`;
      }

      // 🚀 CASE STUDY
      else {
        prompt = `

Generate 2 CBSE Case Study questions.

Return ONLY valid JSON array.

Format:

[
  {
    "type":"case_study",

    "question":"Read the following passage carefully...",

    "options":[
      "...",
      "...",
      "...",
      "..."
    ],

    "correctAnswer":"..."
  }
]

Rules:
- STRICT JSON ONLY
- NO markdown
- NO explanation
- NO extra text

Chapter:
${chunk}

`;
      }

      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",

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

        temperature: 0.3,

        max_tokens: 800,
      });

      const text = completion.choices?.[0]?.message?.content;

      const parsed = extractJSON(text);

      allQuestions = [...allQuestions, ...parsed];
    } catch (err) {
      console.log("❌ AI ERROR:", err.message);

      // 🚀 RATE LIMIT RETRY
      if (err?.status === 429) {
        console.log("⏳ Retrying after rate limit...");

        // 🚀 WAIT 17 SECONDS
        await new Promise((r) => setTimeout(r, 17000));

        // 🚀 RETRY ONLY ONCE
        if (!limitedChunks[i].retried) {
          limitedChunks[i].retried = true;

          i--;

          continue;
        }
      }
    }
  }

  return allQuestions;
}
