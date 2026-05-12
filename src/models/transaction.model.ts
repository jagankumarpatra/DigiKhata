import { Schema, model, Document, Types } from "mongoose";

export interface ITransaction extends Document {
  merchantId:     Types.ObjectId;
  customerId:     Types.ObjectId;
  type:           "CREDIT" | "DEBIT";
  amount:         number;
  note?:          string;
  idempotencyKey: string;
  createdAt:      Date;
}

const transactionSchema = new Schema<ITransaction>({
  merchantId:     { type: Schema.Types.ObjectId, ref: "Merchant", required: true, index: true },
  customerId:     { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  type:           { type: String, enum: ["CREDIT", "DEBIT"], required: true },
  amount:         { type: Number, required: true, min: 1 },
  note:           { type: String, trim: true },
  idempotencyKey: { type: String, required: true, unique: true }
}, { timestamps: true });

export const Transaction = model<ITransaction>("Transaction", transactionSchema);
