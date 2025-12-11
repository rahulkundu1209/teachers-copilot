import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import * as historyCtrl from "../controllers/historyController.js";

const router = Router();
router.use(authMiddleware);

router.get("/", historyCtrl.list);
router.post("/", historyCtrl.add);
// Support both /clear and root DELETE to ensure compatibility
router.delete("/clear", historyCtrl.clearAll);
router.delete("/", historyCtrl.clearAll);

export default router;
