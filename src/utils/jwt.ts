import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const signToken = (merchantId: string): string =>
  jwt.sign({ merchantId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);

export const verifyToken = (token: string): { merchantId: string } => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as { merchantId: string };
  return decoded;
};
