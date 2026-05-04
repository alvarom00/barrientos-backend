import { Router } from "express";
import { optimizeDescription } from "../controllers/ai.controller";

const router = Router();

// 👉 POST /api/ai/optimize-description
router.post("/optimize-description", optimizeDescription);

export default router;