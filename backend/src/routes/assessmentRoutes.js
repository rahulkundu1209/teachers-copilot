import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { submitAssessment } from "../controllers/assessmentController.js";

const router = Router();

router.use(verifyToken);
router.post("/submit", submitAssessment);

export default router;