import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/ApiResponse';
import { env } from '../config/env';
import { timingSafeEqualHex, computeHmacSha256Hex } from '../utils/razorpay';
import * as paymentService from '../services/payment.service';

export const createRazorpayOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const { shippingAddress, couponCode } = req.body;
  const result = await paymentService.createRazorpayOrder(req.user!.id, shippingAddress, couponCode ?? null);
  sendCreated(res, result, 'Razorpay order created');
});

export const verifyRazorpayPaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const result = await paymentService.verifyAndFinalizePayment(req.user!.id, {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  if (result.status === 'PENDING') {
    // Authorized but not yet captured by Razorpay: nothing was fulfilled.
    // The frontend should let the customer know their payment is being
    // confirmed; the payment.captured/order.paid webhook will finalize the
    // order once Razorpay actually captures it.
    sendSuccess(res, { status: 'PENDING' }, 'Payment authorized, awaiting capture confirmation', 202);
    return;
  }

  sendSuccess(res, result.order, 'Payment verified and order placed');
});

export const razorpayWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!env.razorpayWebhookSecret) {
    res.status(503).json({ success: false, message: 'Webhook is not configured' });
    return;
  }

  const signature = req.headers['x-razorpay-signature'];
  if (typeof signature !== 'string' || !signature) {
    res.status(400).json({ success: false, message: 'Missing webhook signature' });
    return;
  }

  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody)) {
    res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    return;
  }

  const expected = computeHmacSha256Hex(env.razorpayWebhookSecret, rawBody);
  if (!timingSafeEqualHex(expected, signature)) {
    res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    return;
  }

  let payload: { event: string; payload?: unknown };
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).json({ success: false, message: 'Malformed webhook payload' });
    return;
  }

  try {
    await paymentService.processWebhookEvent(payload as Parameters<typeof paymentService.processWebhookEvent>[0]);
  } catch (err) {
    // The event is already durably recorded on the PaymentIntent by
    // finalizePaymentIntent's own failure path; there is nothing useful a
    // Razorpay retry could do, so acknowledge receipt instead of causing a
    // retry storm.
    console.error('Razorpay webhook processing failed', err);
  }

  res.status(200).json({ success: true });
});
