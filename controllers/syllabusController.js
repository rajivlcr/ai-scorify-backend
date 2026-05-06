import Subject from "../models/Subject.js";

// ✅ existing
export const getSyllabus = async (req, res) => {
  const data = await Subject.find();
  res.json(data);
};

// ✅ ADD THIS (important)
export const getSubjectByName = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      name: req.params.name,
    });

    if (!subject) {
      return res.status(404).json({ msg: "Subject not found" });
    }

    res.json(subject);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
