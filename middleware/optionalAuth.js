import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function (req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    req.user = user || null;

    next();
  } catch {
    req.user = null;
    next();
  }
}
