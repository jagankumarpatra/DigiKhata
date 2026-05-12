import { Worker, Job } from "bullmq";
import { redis } from "../config/redis";
import { Reminder } from "../models/reminder.model";
import { env } from "../config/env";
import { logger } from "../utils/logger";

interface ReminderJobData {
  reminderId: string;
  phone: string;
  message: string;
}

const processReminder = async (job: Job<ReminderJobData>): Promise<void> => {
  const { reminderId, phone, message } = job.data;

  try {
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      const twilio = require("twilio")(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      await twilio.messages.create({
        from: env.TWILIO_WHATSAPP_FROM,
        to:   `whatsapp:${phone}`,
        body: message
      });
      logger.info(`✅ WhatsApp reminder sent to ${phone}`);
    } else {
      // Dev mode: just log
      logger.info(`[DEV] Reminder to ${phone}: ${message}`);
    }

    await Reminder.findByIdAndUpdate(reminderId, {
      status: "SENT",
      sentAt: new Date()
    });
  } catch (err) {
    await Reminder.findByIdAndUpdate(reminderId, { status: "FAILED" });
    throw err; // BullMQ will retry
  }
};

export const startReminderWorker = (): Worker => {
  const worker = new Worker("reminders", processReminder, {
    connection: redis,
    concurrency: 5
  });

  worker.on("completed", (job) => logger.info(`Reminder job ${job.id} completed`));
  worker.on("failed", (job, err) => logger.error(`Reminder job ${job?.id} failed:`, err.message));

  logger.info("✅ Reminder worker started");
  return worker;
};
