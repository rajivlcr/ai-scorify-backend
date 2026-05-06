import Joi from "joi";

export const quizSchema = Joi.object({
  subject: Joi.string().required(),
  chapter: Joi.string().required(),
});
