import QuestionBank from "../models/QuestionBank.js";
import Result from "../models/Result.js";
import { generateAIQuiz } from "../services/aiService.js";

// 🔥 Generate Quiz
export const generateQuiz = async (req, res) => {
  const { subject, chapter } = req.body;

  try {
    let data = await QuestionBank.findOne({ subject, chapter });

    // ✅ If already exists → return random variant
    if (data && data.variants.length >= 3) {
      const random = Math.floor(Math.random() * data.variants.length);
      return res.json(data.variants[random].questions);
    }

    console.log("Generating new quiz variants...");

    let variants = [];

    for (let i = 0; i < 3; i++) {
      try {
        const questions = await generateAIQuiz(subject, chapter, 20); // 20 questions
        variants.push({ questions });
      } catch (err) {
        console.log("AI failed for variant", i);
      }
    }

    // Save to DB
    if (!data) {
      data = await QuestionBank.create({
        subject,
        chapter,
        variants,
      });
    } else {
      data.variants = variants;
      await data.save();
    }

    // Return random variant
    const random = Math.floor(Math.random() * variants.length);
    res.json(variants[random].questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Quiz generation failed" });
  }
};

// 🔥 Submit Quiz (same as before)
export const submitQuiz = async (req, res) => {
  try {
    const { userId, subject, chapter, quiz, answers } = req.body;

    let score = 0;

    quiz.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        score++;
      }
    });

    await Result.create({
      userId,
      subject,
      chapter,
      score,
      total: quiz.length,
    });

    res.json({
      score,
      total: quiz.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Submit failed" });
  }
};
