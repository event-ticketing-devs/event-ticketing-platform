import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import apiClient from "../api/apiClient";

// Place your Stripe publishable key in your .env as VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Custom Stripe element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#374151",
      fontFamily: '"Inter", "system-ui", "sans-serif"',
      fontSmoothing: "antialiased",
      "::placeholder": {
        color: "#9CA3AF",
      },
      ":-webkit-autofill": {
        color: "#374151",
      },
    },
    invalid: {
      color: "#EF4444",
      iconColor: "#EF4444",
    },
    complete: {
      color: "#10B981",
      iconColor: "#10B981",
    },
  },
  hidePostalCode: true,
};

function CheckoutForm({ amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardComplete, setCardComplete] = useState(false);

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Create PaymentIntent on backend
      const { data } = await apiClient.post("/payments/create-payment-intent", {
        amount,
      });
      const clientSecret = data.clientSecret;

      // 2. Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        onSuccess && onSuccess(result.paymentIntent);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Payment failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-6 py-4 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-bg-primary/20 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-bg-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-bg-primary">Secure Payment</h2>
            <p className="text-bg-primary/80 text-sm">Powered by Stripe</p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Amount Summary */}
        <div className="bg-bg-secondary p-4 border border-border rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary font-medium">Total Amount</span>
            <span className="text-2xl font-bold text-text-primary">
              ₹{amount?.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">
            Card Information
          </label>
          <div className="relative">
            <div className="border border-border rounded-lg p-4 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-colors bg-bg-primary">
              <CardElement
                options={cardElementOptions}
                onChange={handleCardChange}
              />
            </div>
            {cardComplete && (
              <div className="absolute top-4 right-4">
                <div className="w-5 h-5 bg-success/10 border border-success/20 rounded-md flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-error/10 border border-error/20 rounded-md flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-3 h-3 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-error text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-secondary/10 border border-secondary/20 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                className="w-3 h-3 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <p className="text-text-primary text-sm font-medium">
                Your payment is secure
              </p>
              <p className="text-text-secondary text-xs mt-1">
                Your card information is never stored on our servers
              </p>
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <button
          type="submit"
          disabled={!stripe || !cardComplete || loading}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-bg-primary transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
            !stripe || !cardComplete || loading
              ? "bg-primary/40 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90"
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 rounded-full border-bg-primary/30 border-t-bg-primary animate-spin"></div>
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>Pay ₹{amount?.toLocaleString()}</span>
            </>
          )}
        </button>

        {/* Powered by Stripe */}
        <div className="flex items-center justify-center space-x-2 text-text-secondary text-xs">
          <span>Powered by Stripe</span>
        </div>
      </form>
    </div>
  );
}

export default function StripeCheckout({ amount, onSuccess }) {
  return (
    <div className="max-w-md mx-auto">
      <Elements stripe={stripePromise}>
        <CheckoutForm amount={amount} onSuccess={onSuccess} />
      </Elements>
    </div>
  );
}
