import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";

import {
  submitAssessment,
  getAssessmentSubmissions,
  getAssessmentStatus,
} from "../controllers/assessmentController.js";

const router = Router();

router.use(verifyToken);
router.post("/submit", submitAssessment);

router.get(
  "/:courseId/:topicId/status",
  getAssessmentStatus
);

router.get(
  "/:courseId/:topicId/submissions",
  getAssessmentSubmissions
);

export default router;