import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import * as settingsCtrl from "../controllers/settingsController.js";

const router = Router();
router.use(authMiddleware);

router.get("/", settingsCtrl.get);
router.put("/", settingsCtrl.update);

export default router;
