import BookContent from "../models/BookContent.js";

// 🚀 GET SUBJECTS
export const getSubjects = async (req, res) => {
  try {
    const { className } = req.params;

    const subjects = await BookContent.distinct(
      "subject",

      {
        className,
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
    const { name } = req.params;

    const className = req.query.className;

    const chapters = await BookContent.find({
      className,

      subject: name,
    })

      .select("chapter");

    res.json({
      chapters: chapters.map((c) => ({
        name: c.chapter,
      })),
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Failed to fetch chapters",
    });
  }
};
