import { Router } from "express";
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../controllers/property.controller";
import { uploadImages } from "../services/fileStorage";

const router = Router();

router.get("/", getProperties);
router.get("/:id", getPropertyById);
router.post("/", uploadImages.array("images", 15), createProperty);
router.put("/:id", uploadImages.array("images", 15), updateProperty);
router.delete("/:id", deleteProperty);

export default router;
