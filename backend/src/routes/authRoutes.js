import { Router } from "express";
const router = Router();
import {
	register,
	requestOtp,
	verifyOtpAndIssueToken,
	logout,
	registerRequestOtp,
	registerVerifyOtp,
} from "../controllers/authController.js";

// Login flow
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtpAndIssueToken);

// Registration flow (OTP)
router.post("/register/request-otp", registerRequestOtp);
router.post("/register/verify-otp", registerVerifyOtp);

// Legacy direct register (without OTP) kept for compatibility
router.post("/register", register);

router.post("/logout", logout);

export default router;