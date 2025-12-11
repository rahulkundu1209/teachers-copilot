import { Router } from "express";
const router = Router();
import authMiddleware from "../middleware/authMiddleware.js";
import { profile } from "../controllers/userController.js";

router.get("/profile", authMiddleware, profile);

export default router;
