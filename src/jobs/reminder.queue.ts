import { Queue } from "bullmq";
import { redis } from "../config/redis";

export const reminderQueue = new Queue("reminders", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200
  }
});
