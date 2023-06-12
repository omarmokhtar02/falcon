const asyncHandler = require("express-async-handler"),
    stripe = require("stripe")(process.env.STRIPE_SECRET),
    bookingModel = require('../models/bookingModel'),
    ApiError = require("../utils/apiError");

// @desc create Checkout Session
// @route Put /api/v1/order/create-checkout-session/bookingId
// @access Private(user)
exports.createCheckoutSession = asyncHandler(async (req, res, next) => {
    const { shippingAddress } = req.body;

    //1- Get Booking by bookingId
    const booking = await bookingModel.findById(req.params.bookingId);
    if (!booking) {
        return next(new ApiError(404, `this user don't have any booking`));
    }
    //2- Get book Price 
    // eslint-disable-next-line prefer-destructuring
    let totalBookingPrice = booking.totalBookingPrice;

    // stripe checkout sessions
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "egp",
                    product_data: {
                        name: req.user.fname,
                    },
                    unit_amount: totalBookingPrice * 100,
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        success_url: "https://falcon-1e2x.onrender.com/payment/checkout-success",
        cancel_url: "https://falcon-1e2x.onrender.com/payment/checkout-fail",
        customer_email: req.user.email,
        client_reference_id: req.params.bookingId,
        metadata: shippingAddress,
    });
    // 4- send session
    res.status(200).json({ session });
});

const createCardOrder = async (session) => {
    const bookingId = session.client_reference_id;


    // 3) Create booking with default paymentMethodType card
    const book = await bookingModel.findOneAndUpdate({ _id: bookingId }, {
        isPaid: true,
        paidAt: Date.now(),
        paymentMethodType: "card"
    }, { new: true });

};

exports.successPay = asyncHandler(async (req, res, next) => {
    res.status(200).json('Successful Pay')
})

exports.failPay = asyncHandler(async (req, res, next) => {
    res.status(200).json('Fail Pay')
})

// @desc    This webhook will run when stripe payment success paid
// @route   POST /webhook
// @access  Protected/User
exports.webhookCheckOut = asyncHandler(async (req, res, next) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.WEB_HOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type == "checkout.session.completed") {
        console.log("create order....");
    }
    if (event.type == "checkout.session.completed") {
        createCardOrder(event.data.object);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ data: 'ok' });
});
