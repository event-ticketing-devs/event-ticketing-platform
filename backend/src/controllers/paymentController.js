import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create a Stripe PaymentIntent
// @route   POST /api/payments/create-payment-intent
// @access  Protected (should be protected in production)
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = "inr", metadata = {} } = req.body;
    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }
    // Stripe expects amount in cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
