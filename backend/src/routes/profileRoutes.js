import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as profileCtrl from "../controllers/profileController.js";

const router = Router();

router.get("/", verifyToken, profileCtrl.getProfile);
router.put("/", verifyToken, profileCtrl.updateProfile);

export default router;
