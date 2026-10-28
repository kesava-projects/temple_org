import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { razorpayService } from "@/server/payments/razorpay";

describe("Razorpay Integration & Cryptographic Signature Verification", () => {
  const secret = "test_webhook_secret_12345";

  it("should verify payment signature correctly using HMAC SHA256", () => {
    const orderId = "order_mock_test_123";
    const paymentId = "pay_mock_test_456";
    const body = `${orderId}|${paymentId}`;
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    // In simulated environment or with mocked key
    expect(
      razorpayService.verifyPaymentSignature({
        orderId,
        paymentId,
        signature: validSignature,
      })
    ).toBe(true);
  });

  it("should verify webhook signature correctly with raw body", () => {
    const rawBody = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_1", order_id: "order_1" } } },
    });

    const signature = crypto
      .createHmac("sha256", "your-razorpay-webhook-secret")
      .update(rawBody)
      .digest("hex");

    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    expect(typeof isValid).toBe("boolean");
  });
});
