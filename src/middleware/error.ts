import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler = (
  err: Error, _req: Request, res: Response, _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  if (err.name === "ValidationError") {
    res.status(400).json({ success: false, error: err.message });
    return;
  }
  logger.error(err.message, err.stack);
  res.status(500).json({ success: false, error: "Internal server error" });
};
