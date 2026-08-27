import { Schema, model, Types, Document } from 'mongoose';
import { IOrderAddress } from './Order';

// REQUIRES_REFUND means Razorpay captured the payment but GreenKart could not
// complete fulfillment (stock/coupon/order commit failed or aborted) — the
// customer WAS charged and this must be flagged for manual refund, never
// confused with FAILED (which means Razorpay itself never captured the
// payment, so nothing needs to be refunded).
export type PaymentIntentStatus = 'CREATED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REQUIRES_REFUND';

export interface IPaymentIntentLine {
  productId: Types.ObjectId;
  variantSku: string | null;
  name: string;
  image: string;
  variant: Record<string, string> | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IPaymentIntent extends Document {
  user: Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  // Set (and refreshed) whenever the intent transitions into PROCESSING —
  // used purely as a crash-recovery fencing token: it lets a later
  // reconciliation call detect a PROCESSING claim old enough to have almost
  // certainly come from a crashed worker, and lets the finalize transaction
  // detect (and safely abort) if it was superseded by a fresher reclaim
  // before it could commit. See finalizePaymentIntent in payment.service.ts.
  processingStartedAt: Date | null;
  failureReason: string | null;
  shippingAddress: IOrderAddress;
  couponCode: string | null;
  lines: IPaymentIntentLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  order: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentIntentLineSchema = new Schema<IPaymentIntentLine>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantSku: { type: String, default: null },
    name: { type: String, required: true },
    image: { type: String, required: true },
    variant: { type: Schema.Types.Mixed, default: null },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const paymentIntentAddressSchema = new Schema<IOrderAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    addressLine: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false }
);

const paymentIntentSchema = new Schema<IPaymentIntent>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR' },
    status: { type: String, enum: ['CREATED', 'PROCESSING', 'PAID', 'FAILED', 'REQUIRES_REFUND'], default: 'CREATED', index: true },
    processingStartedAt: { type: Date, default: null },
    failureReason: { type: String, default: null },
    shippingAddress: { type: paymentIntentAddressSchema, required: true },
    couponCode: { type: String, default: null },
    lines: [paymentIntentLineSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);

export const PaymentIntent = model<IPaymentIntent>('PaymentIntent', paymentIntentSchema);
