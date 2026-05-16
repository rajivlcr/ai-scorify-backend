import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 🚀 EXTRACT JSON
function extractJSON(text) {
  try {
    const start = text.indexOf("[");

    const end = text.lastIndexOf("]");

    if (start === -1 || end === -1) {
      return [];
    }

    return JSON.parse(text.slice(start, end + 1));
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

  const chunkSize = 2500;

  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
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

      const chunk = limitedChunks[i];

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
- Strict JSON only
- No markdown
- No explanation

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
    "type":"assertion_reason",

    "assertion":"When lightning strikes, the sound is heard a little after the flash is seen.",

    "reason":"The velocity of light is greater than that of sound.",

    "options":[
      "Both A and R are true and R is the correct explanation of A.",
      "Both A and R are true but R is not the correct explanation of A.",
      "A is true but R is false.",
      "A is false but R is true.",
      "Both A and R are false."
    ],

    "correctAnswer":"Both A and R are true and R is the correct explanation of A."
  }
]

Rules:
- Use ONLY the exact options given
- Strict JSON only
- No markdown
- No explanation
- Questions must be CBSE style

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
- Strict JSON only
- No markdown
- No explanation

Chapter:
${chunk}

`;
      }

      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",

        messages: [
          {
            role: "user",

            content: prompt,
          },
        ],

        temperature: 0.3,

        max_tokens: 700,
      });

      const text = completion.choices?.[0]?.message?.content;

      const parsed = extractJSON(text);

      allQuestions = [...allQuestions, ...parsed];
    } catch (err) {
      console.log("❌ AI ERROR:", err.message);
    }
  }

  return allQuestions;
}
