import { Schema, model, Document, Types } from "mongoose";

export interface ICustomer extends Document {
  merchantId: Types.ObjectId;
  name: string;
  phone: string;
  balance: number;       // positive = owes merchant, negative = merchant owes them
  totalCredit: number;
  totalDebit: number;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>({
  merchantId:  { type: Schema.Types.ObjectId, ref: "Merchant", required: true, index: true },
  name:        { type: String, required: true, trim: true },
  phone:       { type: String, required: true, trim: true },
  balance:     { type: Number, default: 0 },
  totalCredit: { type: Number, default: 0 },
  totalDebit:  { type: Number, default: 0 }
}, { timestamps: true });

customerSchema.index({ merchantId: 1, phone: 1 }, { unique: true });

export const Customer = model<ICustomer>("Customer", customerSchema);
