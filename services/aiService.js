import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ✅ SMART CHUNKING
function splitIntoChunks(text, chunkSize = 2500) {
  const chunks = [];

  // ✅ SHORT CHAPTERS
  if (text.length <= 10000) {
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    return chunks;
  }

  // ✅ LONG CHAPTERS
  const quarter = Math.floor(text.length / 4);

  // Beginning
  chunks.push(text.slice(0, chunkSize));

  // Early middle
  chunks.push(text.slice(quarter, quarter + chunkSize));

  // Late middle
  chunks.push(text.slice(quarter * 2, quarter * 2 + chunkSize));

  // Ending
  chunks.push(text.slice(-chunkSize));

  return chunks;
}

// ✅ REMOVE DUPLICATES
function removeDuplicates(questions) {
  const seen = new Set();

  return questions.filter((q) => {
    const normalized = q.question?.toLowerCase()?.trim();

    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);

    return true;
  });
}

// 🔥 GENERATE AI QUIZ
export const generateAIQuiz = async (
  subject,
  chapter,
  chapterContent,
  count = 20,
) => {
  try {
    console.log("📚 Splitting chapter...");

    const chunks = splitIntoChunks(chapterContent);

    // ✅ 4 chunks × 6 = 24
    const questionsPerChunk = 6;

    let allQuestions = [];

    // ✅ PROCESS CHUNKS
    for (let i = 0; i < chunks.length; i++) {
      // ✅ STOP IF ENOUGH
      if (allQuestions.length >= count) {
        break;
      }

      const chunk = chunks[i];

      console.log(`🤖 Processing chunk ${i + 1}/${chunks.length}`);

      const prompt = `
You are an expert CBSE quiz generator.

Generate exactly ${questionsPerChunk} multiple-choice questions ONLY from the NCERT content below.

STRICT RULES:
- Follow NCERT syllabus only
- No extra concepts
- Difficulty suitable for CBSE students
- Each question must have 4 options
- Only ONE correct answer
- Avoid duplicate questions
- Questions should test understanding
- Output MUST be valid JSON only
- No markdown
- No explanations outside JSON

Subject: ${subject}

Chapter: ${chapter}

NCERT CONTENT:
${chunk}

Return format:
[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "string",
    "explanation": ""
  }
]
`;

      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",

          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],

          temperature: 0.7,

          max_tokens: 1200,
        });

        let text = completion.choices[0]?.message?.content;

        if (!text) continue;

        // ✅ EXTRACT JSON
        const start = text.indexOf("[");

        const end = text.lastIndexOf("]");

        if (start === -1 || end === -1) {
          console.log("⚠️ Invalid JSON response skipped");

          continue;
        }

        const jsonString = text.substring(start, end + 1);

        let parsed = [];

        try {
          parsed = JSON.parse(jsonString);
        } catch {
          console.log("⚠️ Invalid JSON skipped");

          continue;
        }

        if (Array.isArray(parsed)) {
          allQuestions.push(...parsed);
        }
      } catch (err) {
        console.log(`❌ Chunk ${i + 1} failed`, err.message);
      }
    }

    // ✅ REMOVE DUPLICATES
    allQuestions = removeDuplicates(allQuestions);

    // ✅ FINAL LIMIT
    allQuestions = allQuestions.slice(0, count);

    console.log(`✅ Final questions: ${allQuestions.length}`);

    return allQuestions;
  } catch (err) {
    console.error("❌ AI ERROR:", err.message);

    throw new Error("AI quiz generation failed");
  }
};
