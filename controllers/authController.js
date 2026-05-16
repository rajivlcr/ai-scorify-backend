import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

import User from "../models/User.js";

// 🚀 REGISTER
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ CHECK EXISTING USER
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        msg: "User already exists",
      });
    }

    // ✅ HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ CREATE USER
    const user = await User.create({
      name,

      email,

      password: hashedPassword,

      // 🚀 FREEMIUM
      plan: "free",

      quizCountToday: 0,
    });

    // ✅ GENERATE TOKEN
    const token = jwt.sign(
      {
        id: user._id,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      },
    );

    // ✅ RESPONSE
    res.json({
      token,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        plan: user.plan,

        quizCountToday: user.quizCountToday,
      },
    });
  } catch (err) {
    console.log(err.message);

    res.status(500).json({
      msg: "Registration failed",
    });
  }
};

// 🚀 LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ FIND USER
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({
        msg: "Invalid credentials",
      });
    }

    // ✅ CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        msg: "Invalid credentials",
      });
    }

    // ✅ GENERATE TOKEN
    const token = jwt.sign(
      {
        id: user._id,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      },
    );

    // ✅ RESPONSE
    res.json({
      token,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        plan: user.plan,

        quizCountToday: user.quizCountToday,
      },
    });
  } catch (err) {
    console.log(err.message);

    res.status(500).json({
      msg: "Login failed",
    });
  }
};
