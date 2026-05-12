import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "./error";

export const validate = (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const msg = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
      return next(new AppError(400, msg));
    }
    req.body = result.data;
    next();
  };
