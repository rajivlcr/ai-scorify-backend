import jwt from "jsonwebtoken";

import User from "../models/User.js";

export default async function (req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        msg: "No token",
      });
    }

    const decoded = jwt.verify(
      token,

      process.env.JWT_SECRET,
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        msg: "User not found",
      });
    }

    // 🚀 CHECK PRO EXPIRY
    if (
      user.plan === "pro" &&
      user.planExpiresAt &&
      new Date() > user.planExpiresAt
    ) {
      console.log("🚀 PRO expired. Downgrading...");

      user.plan = "free";

      user.planExpiresAt = null;

      await user.save();
    }

    req.user = user;

    next();
  } catch (err) {
    console.log(err);

    res.status(401).json({
      msg: "Invalid token",
    });
  }
}
