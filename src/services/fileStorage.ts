import multer from "multer";
import path from "path";

// Destino local
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Carpeta donde se guardan los archivos
  },
  filename: function (req, file, cb) {
    // Nombre único: timestamp-originalname
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  }
});

export const upload = multer({ storage });

export default upload;
