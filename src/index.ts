import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/error";
import { startReminderWorker } from "./jobs/reminder.worker";

import authRoutes        from "./routes/auth.routes";
import customerRoutes    from "./routes/customer.routes";
import transactionRoutes from "./routes/transaction.routes";
import reminderRoutes    from "./routes/reminder.routes";
import { env } from "./config/env";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "digikhata", env: env.NODE_ENV, time: new Date().toISOString() });
});

app.use("/api/v1/auth",         authRoutes);
app.use("/api/v1/customers",    customerRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/reminders",    reminderRoutes);

app.use((_req: Request, res: Response) => res.status(404).json({ success: false, error: "Route not found" }));
app.use(errorHandler);

const start = async () => {
  await connectDB();
  startReminderWorker();
  app.listen(env.PORT, () => logger.info(`🚀 DigiKhata running on http://localhost:${env.PORT}`));
};

start().catch((err) => { logger.error("Startup failed", err); process.exit(1); });
