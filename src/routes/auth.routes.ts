import { Router } from "express";
import * as ctrl from "../controllers/auth.controller";
const router = Router();

router.post("/send-otp",   ctrl.sendOtp);
router.post("/verify-otp", ctrl.verifyOtp);

export default router;
