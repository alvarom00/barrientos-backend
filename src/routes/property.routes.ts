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

// --------- Rutas públicas (lectura)
router.get("/", getAllProperties);
router.get("/:id", getPropertyById);

// --------- Rutas protegidas (mutaciones)
// IMPORTANTE: sólo aceptamos imágenes; los videos ahora son URLs
router.post(
  "/",
  requireAuth,
  upload.fields([{ name: "images", maxCount: 10 }]),
  createProperty
);

router.put(
  "/:id",
  requireAuth,
  upload.fields([{ name: "images", maxCount: 10 }]),
  updateProperty
);

router.delete("/:id", requireAuth, deleteProperty);

export default router;
