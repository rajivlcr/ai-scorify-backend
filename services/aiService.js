import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateAIQuiz = async (subject, chapter, count = 20) => {
  try {
    const prompt = `
Generate exactly ${count} multiple choice questions.

Subject: ${subject}
Chapter: ${chapter}

Rules:
- Each question must have 4 options
- Only ONE correct answer
- No explanations needed
- Avoid duplicate questions
- Output MUST be valid JSON only (no extra text)

Format:
[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "string",
    "explanation": ""
  }
]
`;

    console.log("🤖 Calling AI...");

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // ✅ active model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let text = completion.choices[0]?.message?.content;

    if (!text) throw new Error("Empty AI response");

    // 🔥 CLEAN RESPONSE (important fix)
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");

    if (start === -1 || end === -1) {
      throw new Error("Invalid JSON format from AI");
    }

    const jsonString = text.substring(start, end + 1);

    const questions = JSON.parse(jsonString);

    // 🔍 VALIDATION
    if (!Array.isArray(questions)) {
      throw new Error("AI output is not an array");
    }

    console.log("✅ AI generated questions:", questions.length);

    return questions;
  } catch (err) {
    console.error("❌ AI ERROR:", err.message);

    throw new Error("AI quiz generation failed");
  }
};
