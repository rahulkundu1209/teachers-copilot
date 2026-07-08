import { Router } from "express";
import { getTopicPYQ, selectTopic, getTopicAssessment } from "../controllers/selectController.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.post("/", verifyToken, selectTopic);
router.post("/pyq", verifyToken, getTopicPYQ);
router.post("/assessments", verifyToken, getTopicAssessment);

export default router;