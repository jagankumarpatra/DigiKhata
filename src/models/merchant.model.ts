import { Schema, model, Document } from "mongoose";

export interface IMerchant extends Document {
  name: string;
  phone: string;
  businessName?: string;
  createdAt: Date;
}

const merchantSchema = new Schema<IMerchant>({
  name:         { type: String, required: true, trim: true },
  phone:        { type: String, required: true, unique: true, trim: true },
  businessName: { type: String, trim: true }
}, { timestamps: true });

export const Merchant = model<IMerchant>("Merchant", merchantSchema);
