import mongoose, { Types } from "mongoose";
import { Transaction, ITransaction } from "../models/transaction.model";
import { Customer } from "../models/customer.model";
import { AppError } from "../middleware/error";

interface AddTransactionInput {
  merchantId: string;
  customerId: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  note?: string;
  idempotencyKey: string;
}

export const addTransaction = async (input: AddTransactionInput): Promise<ITransaction> => {
  // Idempotency: return existing if already processed
  const existing = await Transaction.findOne({ idempotencyKey: input.idempotencyKey });
  if (existing) return existing;

  // Verify customer belongs to merchant
  const customer = await Customer.findOne({
    _id: input.customerId,
    merchantId: input.merchantId
  });
  if (!customer) throw new AppError(404, "Customer not found");

  // Atomic transaction: insert txn + update balance in one session
  const session = await mongoose.startSession();
  let transaction: ITransaction;
  try {
    await session.withTransaction(async () => {
      const balanceDelta = input.type === "CREDIT" ? input.amount : -input.amount;
      const creditDelta  = input.type === "CREDIT" ? input.amount : 0;
      const debitDelta   = input.type === "DEBIT"  ? input.amount : 0;

      [transaction] = await Transaction.create([{
        merchantId:     new Types.ObjectId(input.merchantId),
        customerId:     new Types.ObjectId(input.customerId),
        type:           input.type,
        amount:         input.amount,
        note:           input.note,
        idempotencyKey: input.idempotencyKey
      }], { session });

      await Customer.findByIdAndUpdate(
        input.customerId,
        {
          $inc: {
            balance:     balanceDelta,
            totalCredit: creditDelta,
            totalDebit:  debitDelta
          }
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return transaction!;
};

export const getTransactions = async (
  merchantId: string, customerId: string, page: number, limit: number
): Promise<{ transactions: ITransaction[]; total: number }> => {
  const filter = { merchantId, customerId };
  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Transaction.countDocuments(filter)
  ]);
  return { transactions, total };
};

export const getLedgerSummary = async (merchantId: string): Promise<{
  totalReceivable: number;
  totalPayable: number;
  netBalance: number;
  topDebtors: object[];
}> => {
  const [summary, topDebtors] = await Promise.all([
    Customer.aggregate([
      { $match: { merchantId: new Types.ObjectId(merchantId) } },
      { $group: {
        _id: null,
        totalReceivable: { $sum: { $max: ["$balance", 0] } },
        totalPayable:    { $sum: { $abs: { $min: ["$balance", 0] } } },
        netBalance:      { $sum: "$balance" }
      }}
    ]),
    Customer.find({ merchantId, balance: { $gt: 0 } })
      .sort({ balance: -1 }).limit(5).select("name phone balance")
  ]);

  return {
    totalReceivable: summary[0]?.totalReceivable ?? 0,
    totalPayable:    summary[0]?.totalPayable    ?? 0,
    netBalance:      summary[0]?.netBalance      ?? 0,
    topDebtors
  };
};
