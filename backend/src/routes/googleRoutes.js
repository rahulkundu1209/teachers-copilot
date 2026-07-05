import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as googleCtrl from "../controllers/googleController.js";

const router = Router();

router.get("/auth-url", verifyToken, googleCtrl.getGoogleAuthUrl);
router.get("/oauth2callback", googleCtrl.handleGoogleOAuthCallback);

export default router;
