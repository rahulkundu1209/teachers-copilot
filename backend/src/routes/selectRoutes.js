import { Router } from "express";
import { getTopicPYQ, selectTopic } from "../controllers/selectController.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.post("/", verifyToken, selectTopic);
router.post("/pyq", verifyToken, getTopicPYQ);

export default router;