import { redis } from "../config/redis";
import { env } from "../config/env";

const key = (phone: string) => `otp:${phone}`;

export const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const saveOtp = async (phone: string, otp: string): Promise<void> => {
  await redis.set(key(phone), otp, "EX", env.OTP_EXPIRES_IN_MIN * 60);
};

export const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
  const stored = await redis.get(key(phone));
  if (!stored || stored !== otp) return false;
  await redis.del(key(phone));
  return true;
};
