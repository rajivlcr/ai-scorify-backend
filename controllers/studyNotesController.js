import BookContent from "../models/BookContent.js";
import QuestionBankV2 from "../models/QuestionBankV2.js";

const normalize = (text) =>
  text?.toLowerCase()?.trim()?.replace("mathematics", "maths");

export const getStudyNotes = async (req, res) => {
  try {
    const { className, subject, chapter } = req.body;

    if (!className || !subject || !chapter) {
      return res.status(400).json({
        msg: "Missing parameters",
      });
    }

    if (!req.user || req.user.plan !== "pro") {
      return res.status(403).json({
        premiumRequired: true,
        msg: "Study Notes available for Pro users only",
      });
    }

    const content = await BookContent.findOne({
      className,
      subject: normalize(subject),
      chapter: normalize(chapter),
    });

    if (!content) {
      return res.status(404).json({
        msg: "Chapter not found",
      });
    }

    const questionBank = await QuestionBankV2.findOne({
      className,
      subject: normalize(subject),
      chapter: normalize(chapter),
    });

    const text = content.content || "";

    const sentences = text
      .replace(/\n/g, " ")
      .split(".")
      .map((s) => s.trim())
      .filter(Boolean);

    // 📖 CHAPTER OVERVIEW
    const summary =
      sentences.slice(0, 8).join(". ") + (sentences.length ? "." : "");

    // 🎯 KEY CONCEPTS
    const concepts = [
      ...new Set(
        questionBank?.questions
          ?.map((q) => q.learningObjective)
          .filter(Boolean),
      ),
    ].slice(0, 10);

    // 📚 DEFINITIONS
    const definitions = sentences
      .filter((s) => s.length > 40 && s.length < 160)
      .slice(0, 8);

    // 📝 BOARD EXAM FOCUS
    const boardFocus = [
      ...new Set(
        questionBank?.questions
          ?.map((q) => q.learningObjective)
          .filter(Boolean),
      ),
    ].slice(0, 8);

    // ❓ EXPECTED QUESTIONS
    const expectedQuestions =
      boardFocus.length > 0
        ? boardFocus.map((item) => `Explain ${item}`)
        : [
            `Explain ${chapter}`,
            `Write short notes on ${chapter}`,
            `State important concepts in ${chapter}`,
            `Write applications related to ${chapter}`,
            `Important board questions from ${chapter}`,
          ];

    // 🏆 COMMON MISTAKES
    const commonMistakes = [
      "Memorizing without understanding concepts",
      "Ignoring NCERT examples",
      "Skipping keywords in answers",
      "Not practicing application-based questions",
      "Missing important definitions",
    ];

    // ⚡ MUST REMEMBER
    const mustRemember =
      normalize(subject) === "maths"
        ? [
            "Memorize all formulas",
            "Practice solved examples",
            "Focus on step-wise calculations",
            "Revise important theorems",
            "Check units and final answers",
          ]
        : [
            "Learn important definitions",
            "Revise NCERT examples",
            "Understand concepts clearly",
            "Practice previous year questions",
            "Revise diagrams and activities",
          ];

    // 🚀 QUICK REVISION SHEET
    const quickRevision = sentences.slice(0, 12);

    res.json({
      chapter,

      summary,

      concepts,

      definitions,

      boardFocus,

      expectedQuestions,

      commonMistakes,

      mustRemember,

      quickRevision,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Failed to generate study notes",
    });
  }
};
