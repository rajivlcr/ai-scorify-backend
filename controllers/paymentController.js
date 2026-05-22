import dotenv from "dotenv";

dotenv.config();
import Razorpay from "razorpay";

import crypto from "crypto";

import User from "../models/User.js";

// 🚀 INSTANCE
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,

  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🚀 CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const options = {
      // 🚀 ₹199
      amount: 19900,

      currency: "INR",

      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json(order);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Order creation failed",
    });
  }
};

// 🚀 VERIFY PAYMENT
export const verifyPayment = async (req, res) => {
  try {
    const {
      userId,

      razorpay_order_id,

      razorpay_payment_id,

      razorpay_signature,
    } = req.body;

    // 🚀 VERIFY SIGNATURE
    const sign = crypto

      .createHmac(
        "sha256",

        process.env.RAZORPAY_KEY_SECRET,
      )

      .update(razorpay_order_id + "|" + razorpay_payment_id)

      .digest("hex");

    // 🚀 INVALID
    if (sign !== razorpay_signature) {
      return res.status(400).json({
        msg: "Invalid signature",
      });
    }

    // 🚀 USER
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // 🚀 ACTIVATE PRO
    user.plan = "pro";

    // 🚀 30 DAYS EXPIRY
    const expiry = new Date();

    expiry.setDate(expiry.getDate() + 30);

    user.planExpiresAt = expiry;

    await user.save();

    res.json({
      success: true,

      user,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Payment verification failed",
    });
  }
};
