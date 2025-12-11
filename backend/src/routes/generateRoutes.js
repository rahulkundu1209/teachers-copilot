import { Router } from "express";
import { generate } from "../controllers/generateController.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.post("/", verifyToken, generate);

export default router;
