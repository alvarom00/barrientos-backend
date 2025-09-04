import { Router } from "express";
import {
  getProperties,
  getPropertyByIdOrSlug,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../controllers/property.controller";
import { uploadImages } from "../services/fileStorage";

const router = Router();

router.get("/", getProperties);
// 👇 acepta id o slug (compat con URLs viejas)
router.get("/:idOrSlug", getPropertyByIdOrSlug);

router.post("/", uploadImages.array("images", 15), createProperty);
router.put("/:id", uploadImages.array("images", 15), updateProperty);
router.delete("/:id", deleteProperty);

export default router;
