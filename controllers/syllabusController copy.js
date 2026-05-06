import Subject from "../models/Subject.js";

export const getSyllabus = async (req, res) => {
  const data = await Subject.find();
  res.json(data);
};
