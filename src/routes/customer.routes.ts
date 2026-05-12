import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as ctrl from "../controllers/customer.controller";
const router = Router();

router.use(authenticate);
router.post("/",     ctrl.create);
router.get("/",      ctrl.list);
router.get("/:id",   ctrl.getOne);
router.patch("/:id", ctrl.update);
router.delete("/:id",ctrl.remove);

export default router;
