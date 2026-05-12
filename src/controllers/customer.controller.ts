import { Response, NextFunction } from "express";
import { z } from "zod";
import * as customerService from "../services/customer.service";
import { AuthRequest } from "../types";

const createSchema = z.object({
  name:  z.string().min(1).max(100),
  phone: z.string().regex(/^\+?[0-9]{10,13}$/, "Invalid phone")
});
const updateSchema = createSchema.partial();

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, phone } = createSchema.parse(req.body);
    const customer = await customerService.createCustomer(req.merchantId!, name, phone);
    res.status(201).json({ success: true, data: customer });
  } catch (err) { next(err); }
};

export const list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const result = await customerService.getCustomers(req.merchantId!, page, limit);
    res.json({ success: true, ...result, page, limit });
  } catch (err) { next(err); }
};

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customer = await customerService.getCustomerById(req.merchantId!, req.params.id);
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates  = updateSchema.parse(req.body);
    const customer = await customerService.updateCustomer(req.merchantId!, req.params.id, updates);
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await customerService.deleteCustomer(req.merchantId!, req.params.id);
    res.json({ success: true, message: "Customer deleted" });
  } catch (err) { next(err); }
};
