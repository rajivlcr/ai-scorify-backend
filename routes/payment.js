import express from "express";

import {
  createOrder,
  verifyPayment,
} from "../controllers/paymentController.js";

console.log("PAYMENT ROUTES LOADED");

const router = express.Router();

// 🚀 TEST
router.get(
  "/test",

  (req, res) => {
    res.send("Payment route working");
  },
);

// 🚀 CREATE ORDER
router.post(
  "/create-order",

  createOrder,
);

// 🚀 VERIFY
router.post(
  "/verify",

  verifyPayment,
);

export default router;
