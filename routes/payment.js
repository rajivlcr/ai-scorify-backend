import express from "express";

import auth from "../middleware/auth.js";

import {
  createOrder,
  verifyPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

// 🚀 CREATE ORDER
router.post(
  "/create-order",

  auth,

  createOrder,
);

// 🚀 VERIFY PAYMENT
router.post(
  "/verify",

  auth,

  verifyPayment,
);

export default router;
