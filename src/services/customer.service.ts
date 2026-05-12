import { Customer, ICustomer } from "../models/customer.model";
import { AppError } from "../middleware/error";
import { Types } from "mongoose";

export const createCustomer = async (
  merchantId: string, name: string, phone: string
): Promise<ICustomer> => {
  const exists = await Customer.findOne({ merchantId, phone });
  if (exists) throw new AppError(409, "Customer with this phone already exists");
  return Customer.create({ merchantId: new Types.ObjectId(merchantId), name, phone });
};

export const getCustomers = async (
  merchantId: string, page: number, limit: number
): Promise<{ customers: ICustomer[]; total: number }> => {
  const [customers, total] = await Promise.all([
    Customer.find({ merchantId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Customer.countDocuments({ merchantId })
  ]);
  return { customers, total };
};

export const getCustomerById = async (
  merchantId: string, customerId: string
): Promise<ICustomer> => {
  const customer = await Customer.findOne({
    _id: customerId, merchantId
  });
  if (!customer) throw new AppError(404, "Customer not found");
  return customer;
};

export const updateCustomer = async (
  merchantId: string, customerId: string, updates: Partial<Pick<ICustomer, "name" | "phone">>
): Promise<ICustomer> => {
  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, merchantId },
    updates,
    { new: true, runValidators: true }
  );
  if (!customer) throw new AppError(404, "Customer not found");
  return customer;
};

export const deleteCustomer = async (
  merchantId: string, customerId: string
): Promise<void> => {
  const res = await Customer.deleteOne({ _id: customerId, merchantId });
  if (res.deletedCount === 0) throw new AppError(404, "Customer not found");
};
