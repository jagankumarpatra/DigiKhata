import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import { Customer } from "../models/customer.model";
import { Merchant } from "../models/merchant.model";
import { Reminder } from "../models/reminder.model";
import { reminderQueue } from "../jobs/reminder.queue";
import { AppError } from "../middleware/error";
import { logger } from "../utils/logger";

const anthropic = env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  : null;

export const draftReminderMessage = async (
  merchantName: string,
  businessName: string,
  customerName: string,
  amount: number
): Promise<string> => {
  if (!anthropic) {
    return `Hi ${customerName}, you have a pending due of ₹${amount} with ${businessName}. Please clear at your earliest. - ${merchantName}`;
  }

  const prompt = `You are helping a small Indian merchant send a polite payment reminder to their customer.
Merchant: ${merchantName}, Business: ${businessName}
Customer: ${customerName}, Amount due: ₹${amount}
Write a short, friendly WhatsApp reminder in Hinglish (mix of Hindi and English). 
Max 2 sentences. Polite, not aggressive. Don't use emojis excessively.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 150,
    messages: [{ role: "user", content: prompt }]
  });

  return (response.content[0] as { text: string }).text.trim();
};

export const queueReminder = async (
  merchantId: string,
  customerId: string
): Promise<{ jobId: string; message: string }> => {
  const [merchant, customer] = await Promise.all([
    Merchant.findById(merchantId),
    Customer.findOne({ _id: customerId, merchantId })
  ]);
  if (!merchant || !customer) throw new AppError(404, "Merchant or customer not found");
  if (customer.balance <= 0) throw new AppError(400, "No outstanding balance for this customer");

  const message = await draftReminderMessage(
    merchant.name,
    merchant.businessName || merchant.name,
    customer.name,
    customer.balance
  );

  const reminder = await Reminder.create({ merchantId, customerId, message });

  const job = await reminderQueue.add("send-reminder", {
    reminderId: reminder._id.toString(),
    phone:      customer.phone,
    message
  }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });

  return { jobId: job.id as string, message };
};
