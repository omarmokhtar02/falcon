const express = require("express");

const { authProtect, allowedTo } = require("../Controller/authService");

const {
  createCheckoutSession,
  successPay,
  failPay
} = require("../Controller/paymentServices");

const router = express.Router();
router.get('/checkout-success', successPay);
router.get('/checkout-fail', failPay);
router.use(authProtect);
router.post(
  "/create-checkout-session/:bookingId",
  allowedTo("user"),
  createCheckoutSession
);

module.exports = router;
