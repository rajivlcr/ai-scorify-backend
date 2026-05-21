import BookContent from "../models/BookContent.js";

// 🚀 GET SUBJECTS
export const getSubjects = async (req, res) => {
  try {
    const { className } = req.params;

    const subjects = await BookContent.distinct(
      "subject",

      {
        className: className.toLowerCase(),
      },
    );

    res.json(subjects);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Failed to fetch subjects",
    });
  }
};

// 🚀 GET CHAPTERS
export const getChapters = async (req, res) => {
  try {
    const { className, subject } = req.params;

    const chapters = await BookContent.distinct(
      "chapter",

      {
        className: className.toLowerCase(),

        subject: subject.toLowerCase(),
      },
    );

    res.json(chapters);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Failed to fetch chapters",
    });
  }
};
