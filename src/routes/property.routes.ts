import { Router } from "express";
import upload from "../services/fileStorage";
import {
  getAllProperties,
  createProperty,
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "../controllers/property.controller";
import multer from "multer";

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Opcional: separar imágenes y videos
    if (file.mimetype.startsWith("image/")) {
      cb(null, "uploads/images/");
    } else if (file.mimetype.startsWith("video/")) {
      cb(null, "uploads/videos/");
    } else {
      cb(null, "uploads/others/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

router.get("/", getAllProperties);
router.get("/:id", getPropertyById);
router.put(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  updateProperty
);
router.delete("/:id", deleteProperty);
router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  createProperty
);

export default router;
