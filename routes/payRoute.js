const express = require("express");

const { authProtect, allowedTo } = require("../Controller/authService");

const {
  createCheckoutSession,
  successPay,
  failPay
} = require("../Controller/paymentServices");

const router = express.Router();
router.use(authProtect);
router.post(
  "/create-checkout-session/:bookingId",
  allowedTo("user"),
  createCheckoutSession
);

router.get('/checkout-success', allowedTo("user"), successPay)
router.get('/checkout-fail', allowedTo("user"), failPay)



module.exports = router;
