import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import upload from "../services/fileStorage";
import {
  getAllProperties,
  createProperty,
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "../controllers/property.controller";

const router = Router();

router.get("/", getAllProperties);
router.get("/:id", getPropertyById);
router.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  createProperty
);

router.put(
  "/:id",
  requireAuth,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  updateProperty
);

router.delete("/:id", requireAuth, deleteProperty);

export default router;
