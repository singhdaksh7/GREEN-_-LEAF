import { Schema, model, Types, Document } from 'mongoose';

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  addresses: Types.ObjectId[];
  isActive: boolean;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN'], default: 'CUSTOMER' },
    addresses: [{ type: Schema.Types.ObjectId, ref: 'Address' }],
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
