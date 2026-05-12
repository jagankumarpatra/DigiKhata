import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as ctrl from "../controllers/transaction.controller";
const router = Router();

router.use(authenticate);
router.post("/",                               ctrl.add);
router.get("/summary",                         ctrl.summary);
router.get("/:customerId",                     ctrl.list);
router.get("/:customerId/statement",           ctrl.downloadStatement);

export default router;
