import { Response, NextFunction } from "express";
import { z } from "zod";
import * as txService from "../services/transaction.service";
import { AuthRequest } from "../types";
import { generateStatement } from "../services/pdf.service";

const addSchema = z.object({
  customerId:     z.string().length(24),
  type:           z.enum(["CREDIT", "DEBIT"]),
  amount:         z.number().positive().max(10_000_000),
  note:           z.string().max(200).optional(),
  idempotencyKey: z.string().min(1).max(100)
});

export const add = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = addSchema.parse(req.body);
    const tx   = await txService.addTransaction({ merchantId: req.merchantId!, ...body });
    res.status(201).json({ success: true, data: tx });
  } catch (err) { next(err); }
};

export const list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page       = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit      = Math.min(100, parseInt(req.query.limit as string) || 20);
    const customerId = req.params.customerId;
    const result     = await txService.getTransactions(req.merchantId!, customerId, page, limit);
    res.json({ success: true, ...result, page, limit });
  } catch (err) { next(err); }
};

export const summary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await txService.getLedgerSummary(req.merchantId!);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const downloadStatement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buffer = await generateStatement(req.merchantId!, req.params.customerId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=statement-${req.params.customerId}.pdf`);
    res.send(buffer);
  } catch (err) { next(err); }
};
