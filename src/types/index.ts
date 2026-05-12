import { Request } from "express";
import { Types } from "mongoose";

export interface AuthRequest extends Request {
  merchantId?: string;
}

export interface OtpPayload {
  phone: string;
  otp: string;
  expiresAt: number;
}

export type TransactionType = "CREDIT" | "DEBIT";

export interface PaginationQuery {
  page?: string;
  limit?: string;
}
