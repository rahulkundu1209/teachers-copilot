// calcRoutes.js
import { Router } from "express";
const router = Router();
import { calculate } from "../controllers/calcController.js";

router.post("/calc", calculate);

export default router;
