import Razorpay from "razorpay";

import crypto from "crypto";

import User from "../models/User.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,

  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🚀 CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const options = {
      amount: 9900,

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
      razorpay_order_id,

      razorpay_payment_id,

      razorpay_signature,
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac(
        "sha256",

        process.env.RAZORPAY_KEY_SECRET,
      )

      .update(sign.toString())

      .digest("hex");

    // ✅ VERIFY
    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        msg: "Invalid payment",
      });
    }

    // ✅ UPDATE USER
    const user = await User.findById(req.user._id);

    user.plan = "pro";

    user.subscriptionExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    await user.save();

    res.json({
      success: true,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        plan: user.plan,

        quizCountToday: user.quizCountToday,
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Payment verification failed",
    });
  }
};
