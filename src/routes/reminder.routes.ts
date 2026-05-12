import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as ctrl from "../controllers/reminder.controller";
const router = Router();

router.use(authenticate);
router.post("/", ctrl.queue);

export default router;
