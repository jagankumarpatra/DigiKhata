import { Response, NextFunction } from "express";
import { z } from "zod";
import * as reminderService from "../services/reminder.service";
import { AuthRequest } from "../types";

const queueSchema = z.object({ customerId: z.string().length(24) });

export const queue = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { customerId } = queueSchema.parse(req.body);
    const result = await reminderService.queueReminder(req.merchantId!, customerId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
