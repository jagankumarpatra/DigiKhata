import { Schema, model, Document, Types } from "mongoose";

export interface IReminder extends Document {
  merchantId:  Types.ObjectId;
  customerId:  Types.ObjectId;
  message:     string;
  status:      "PENDING" | "SENT" | "FAILED";
  sentAt?:     Date;
  createdAt:   Date;
}

const reminderSchema = new Schema<IReminder>({
  merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  message:    { type: String, required: true },
  status:     { type: String, enum: ["PENDING", "SENT", "FAILED"], default: "PENDING" },
  sentAt:     { type: Date }
}, { timestamps: true });

export const Reminder = model<IReminder>("Reminder", reminderSchema);
