import { Merchant } from "../models/merchant.model";
import { generateOtp, saveOtp, verifyOtp } from "../utils/otp";
import { signToken } from "../utils/jwt";
import { AppError } from "../middleware/error";
import { logger } from "../utils/logger";

export const sendOtp = async (phone: string): Promise<void> => {
  const otp = generateOtp();
  await saveOtp(phone, otp);
  // In production: send via Twilio SMS. For dev, log it.
  logger.info(`OTP for ${phone}: ${otp}`);
};

export const verifyOtpAndLogin = async (
  phone: string, otp: string, name?: string, businessName?: string
): Promise<{ token: string; isNew: boolean }> => {
  const valid = await verifyOtp(phone, otp);
  if (!valid) throw new AppError(400, "Invalid or expired OTP");

  let merchant = await Merchant.findOne({ phone });
  let isNew = false;

  if (!merchant) {
    if (!name) throw new AppError(400, "Name is required for new registration");
    merchant = await Merchant.create({ phone, name, businessName });
    isNew = true;
  }

  const token = signToken(merchant._id.toString());
  return { token, isNew };
};
