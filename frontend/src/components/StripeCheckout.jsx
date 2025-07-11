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

function CheckoutForm({ amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <CardElement className="border p-3 rounded" />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded font-semibold w-full mt-2 disabled:opacity-60"
      >
        {loading ? "Processing..." : `Pay ₹${amount}`}
      </button>
    </form>
  );
}

export default function StripeCheckout({ amount, onSuccess }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} />
    </Elements>
  );
}
