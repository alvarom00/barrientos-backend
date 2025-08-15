import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 15,
  },
  fileFilter: (_req, file, cb) => {
    const isImage = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    if (isImage) {
      return cb(null, true);
    }
    return cb(new Error("Solo se permiten imágenes (jpg, png, webp, gif)"));
  },
});

export function uploadImageBufferToCloudinary(
  buffer: Buffer,
  filename: string,
  folder = process.env.CLOUDINARY_FOLDER || "barrientos"
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename.split(".")[0],
        resource_type: "image",
      },
      (err, result) => {
        if (err || !result) return reject(err);
        return resolve({
          secure_url: result.secure_url!,
          public_id: result.public_id!,
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}
