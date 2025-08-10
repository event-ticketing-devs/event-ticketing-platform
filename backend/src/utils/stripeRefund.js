import Stripe from "stripe";

// Initialize Stripe lazily to ensure environment variables are loaded
let stripe;
const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

/**
 * Process a refund for a booking
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {number} amount - Amount to refund in cents (optional, defaults to full refund)
 * @param {string} reason - Reason for refund
 * @returns {Object} Refund object from Stripe
 */
export const processRefund = async (
  paymentIntentId,
  amount = null,
  reason = "requested_by_customer"
) => {
  try {
    if (!paymentIntentId) {
      throw new Error("Payment intent ID is required for refund");
    }

    // Create refund parameters
    const refundParams = {
      payment_intent: paymentIntentId,
      reason: reason, // Can be: 'duplicate', 'fraudulent', 'requested_by_customer'
    };

    // If amount is specified, add it to the refund (partial refund)
    if (amount) {
      refundParams.amount = Math.round(amount * 100); // Convert to cents
    }

    console.log("Processing refund with params:", refundParams);

    // Create the refund
    const refund = await getStripe().refunds.create(refundParams);

    console.log("Refund processed successfully:", refund.id);

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100, // Convert back to rupees
      status: refund.status,
      refund: refund,
    };
  } catch (error) {
    console.error("Stripe refund error:", error.message);

    return {
      success: false,
      error: error.message,
      type: error.type || "unknown_error",
    };
  }
};

/**
 * Get refund status from Stripe
 * @param {string} refundId - Stripe refund ID
 * @returns {Object} Refund status
 */
export const getRefundStatus = async (refundId) => {
  try {
    const refund = await getStripe().refunds.retrieve(refundId);

    return {
      success: true,
      status: refund.status,
      amount: refund.amount / 100,
      refund: refund,
    };
  } catch (error) {
    console.error("Error retrieving refund status:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};
