import { Router } from "express";
import { selectTopic } from "../controllers/selectController.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.post("/", verifyToken, selectTopic);

export default router;