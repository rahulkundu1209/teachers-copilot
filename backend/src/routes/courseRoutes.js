import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as courseCtrl from "../controllers/courseController.js";

const router = Router();

router.use(verifyToken);

router.get("/", courseCtrl.list);
router.post("/", courseCtrl.create);
router.post("/join", courseCtrl.joinByCode);
router.get("/:id", courseCtrl.getOne);
router.put("/:id", courseCtrl.update);
router.delete("/:id", courseCtrl.remove);

export default router;
