import { Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AppError } from "./error";
import { AuthRequest } from "../types";

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new AppError(401, "No token provided");
    const token = header.split(" ")[1];
    const { merchantId } = verifyToken(token);
    req.merchantId = merchantId;
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
};
