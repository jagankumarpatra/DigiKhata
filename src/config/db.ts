import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

export const connectDB = async (): Promise<void> => {
  mongoose.set("strictQuery", true);
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));
  await mongoose.connect(env.MONGODB_URI);
  logger.info("✅ MongoDB connected");
};
