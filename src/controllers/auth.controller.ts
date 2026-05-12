import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service";

const sendOtpSchema = z.object({ phone: z.string().regex(/^\+?[0-9]{10,13}$/, "Invalid phone") });
const verifyOtpSchema = z.object({
  phone:        z.string(),
  otp:          z.string().length(6),
  name:         z.string().min(1).optional(),
  businessName: z.string().optional()
});

export const sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone } = sendOtpSchema.parse(req.body);
    await authService.sendOtp(phone);
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) { next(err); }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone, otp, name, businessName } = verifyOtpSchema.parse(req.body);
    const { token, isNew } = await authService.verifyOtpAndLogin(phone, otp, name, businessName);
    res.status(isNew ? 201 : 200).json({ success: true, token, isNew });
  } catch (err) { next(err); }
};
