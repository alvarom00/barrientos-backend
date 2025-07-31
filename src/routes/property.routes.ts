import { Router } from "express";
import {
  getAllProperties,
  createProperty,
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "../controllers/property.controller";

const router = Router();

router.get("/", getAllProperties);
router.post("/", createProperty);
router.get("/:id", getPropertyById);
router.put("/:id", updateProperty);
router.delete("/:id", deleteProperty);

export default router;
