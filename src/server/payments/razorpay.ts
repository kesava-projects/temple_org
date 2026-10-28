import Razorpay from "razorpay";
import crypto from "node:crypto";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

const isConfigured = Boolean(
  keyId && keySecret && !keyId.includes("placeholder")
);

const razorpayClient = isConfigured
  ? new Razorpay({
      key_id: keyId!,
      key_secret: keySecret!,
    })
  : null;

export interface CreateOrderParams {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
}

export const razorpayService = {
  /**
   * Creates an order with Razorpay in INR.
   * Security Rule 3: Amount is strictly in integer paise computed on the server.
   */
  async createOrder({
    amountInPaise,
    currency = "INR",
    receipt,
    notes,
  }: CreateOrderParams): Promise<RazorpayOrderResult> {
    if (!razorpayClient) {
      // Development simulated order
      const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(
        `[Razorpay Simulated Order] ID: ${mockOrderId} | Amount: ${amountInPaise} paise | Receipt: ${receipt}`
      );
      return {
        id: mockOrderId,
        amount: amountInPaise,
        currency,
        receipt,
        status: "created",
      };
    }

    const order = await razorpayClient.orders.create({
      amount: amountInPaise,
      currency,
      receipt,
      notes,
    });

    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      receipt: order.receipt ?? undefined,
      status: order.status,
    };
  },

  /**
   * Verifies Razorpay payment signature generated on checkout modal.
   */
  verifyPaymentSignature({
    orderId,
    paymentId,
    signature,
  }: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    if (orderId.startsWith("order_mock_") || !isConfigured) {
      // In development simulated environment
      return true;
    }

    if (!keySecret) {
      return false;
    }

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  },

  /**
   * Security Rule 4: Verifies Razorpay webhook signature using raw request body.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!webhookSecret || webhookSecret.includes("placeholder")) {
      // Development fallback if webhook secret is not set
      console.warn("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not set; simulated acceptance in dev.");
      return true;
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );
    } catch {
      return false;
    }
  },

  /**
   * Refunds a payment through Razorpay API.
   */
  async refundPayment(
    paymentId: string,
    amountInPaise?: number
  ): Promise<{ id: string; status: string }> {
    if (!razorpayClient || paymentId.startsWith("pay_mock_")) {
      const mockRefundId = `rfnd_mock_${Date.now()}`;
      console.log(
        `[Razorpay Simulated Refund] Payment ID: ${paymentId} | Refund ID: ${mockRefundId}`
      );
      return { id: mockRefundId, status: "processed" };
    }

    const refund = await razorpayClient.payments.refund(paymentId, {
      amount: amountInPaise,
    });

    return { id: refund.id, status: refund.status };
  },
};
