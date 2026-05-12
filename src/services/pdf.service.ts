import PDFDocument from "pdfkit";
import { Readable } from "stream";
import { Customer } from "../models/customer.model";
import { Transaction } from "../models/transaction.model";
import { Merchant } from "../models/merchant.model";
import { AppError } from "../middleware/error";

export const generateStatement = async (
  merchantId: string,
  customerId: string
): Promise<Buffer> => {
  const [merchant, customer, transactions] = await Promise.all([
    Merchant.findById(merchantId),
    Customer.findOne({ _id: customerId, merchantId }),
    Transaction.find({ merchantId, customerId }).sort({ createdAt: -1 }).limit(50)
  ]);

  if (!merchant || !customer) throw new AppError(404, "Customer not found");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(20).fillColor("#1F4E79").text("DigiKhata", 50, 50);
    doc.fontSize(10).fillColor("#555555").text("Account Statement", 50, 75);
    doc.moveTo(50, 90).lineTo(550, 90).stroke("#1F4E79");

    // Merchant + Customer info
    doc.fontSize(11).fillColor("#000000");
    doc.text(`Merchant: ${merchant.name} (${merchant.businessName || ""})`, 50, 105);
    doc.text(`Customer: ${customer.name}  |  Phone: ${customer.phone}`, 50, 120);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 50, 135);

    // Balance Summary
    doc.fontSize(12).fillColor("#1F4E79").text("Balance Summary", 50, 160);
    doc.fontSize(11).fillColor("#000000");
    doc.text(`Total Credit (You gave):  ₹${customer.totalCredit.toFixed(2)}`, 50, 178);
    doc.text(`Total Debit (You received): ₹${customer.totalDebit.toFixed(2)}`, 50, 193);
    doc.fontSize(13).fillColor(customer.balance >= 0 ? "#C00000" : "#0F6E56");
    doc.text(
      `Net Balance: ₹${Math.abs(customer.balance).toFixed(2)} ${customer.balance >= 0 ? "(Customer owes you)" : "(You owe customer)"}`,
      50, 213
    );

    // Transactions Table
    doc.moveTo(50, 235).lineTo(550, 235).stroke("#cccccc");
    doc.fontSize(10).fillColor("#1F4E79");
    doc.text("Date",    50,  245);
    doc.text("Type",   200,  245);
    doc.text("Amount", 300,  245);
    doc.text("Note",   400,  245);
    doc.moveTo(50, 258).lineTo(550, 258).stroke("#cccccc");

    let y = 268;
    doc.fillColor("#000000");
    for (const tx of transactions) {
      if (y > 720) { doc.addPage(); y = 50; }
      const date = new Date(tx.createdAt).toLocaleDateString("en-IN");
      doc.text(date,                50, y);
      doc.fillColor(tx.type === "CREDIT" ? "#C00000" : "#0F6E56")
         .text(tx.type,            200, y);
      doc.fillColor("#000000")
         .text(`₹${tx.amount}`,    300, y);
      doc.text(tx.note || "-",     400, y, { width: 140 });
      y += 20;
    }

    doc.end();
  });
};
