import Razorpay from "razorpay";
import crypto from "crypto";
import { ApiError } from "./ApiError.js";

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay order
 */
export const createRazorpayOrder = async (
  amount,
  currency = "INR",
  receipt = null
) => {
  try {
    // Validate amount
    if (!amount || amount <= 0 || isNaN(amount)) {
      throw new ApiError(400, "Invalid amount. Amount must be greater than 0.");
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    };

    // Validate options before sending to Razorpay
    if (!options.amount || options.amount <= 0) {
      throw new ApiError(400, "Invalid amount. Amount must be greater than 0.");
    }

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to create Razorpay order");
  }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    return generatedSignature === signature;
  } catch (error) {
    console.error("Razorpay signature verification error:", error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("Razorpay fetch payment error:", error);
    throw new ApiError(500, "Failed to fetch payment details");
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (paymentId, amount = null) => {
  try {
    const refundData = amount
      ? { payment_id: paymentId, amount: Math.round(amount * 100) }
      : { payment_id: paymentId };

    const refund = await razorpay.payments.refund(paymentId, refundData);
    return refund;
  } catch (error) {
    console.error("Razorpay refund error:", error);
    throw new ApiError(500, "Failed to process refund");
  }
};
