import { Schema, model, Types, Document } from 'mongoose';

export interface ICartItem {
  product: Types.ObjectId;
  variantSku: string | null;
  quantity: number;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantSku: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

export const Cart = model<ICart>('Cart', cartSchema);
