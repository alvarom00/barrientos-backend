import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import seoRoutes from "./routes/seo";
import multer from "multer";

import propertyRoutes from "./routes/property.routes";
import authRoutes from "./routes/auth";
import publicarRoutes from "./routes/publicar";
import contactPropertyRoutes from "./routes/contactProperty";

dotenv.config();
const app = express();

app.set("trust proxy", 1);

// --- CORS ---
const ALLOW = [
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_ORIGIN_WWW,
  "http://localhost:5173",
]
  .filter(Boolean)
  .map((o) => o!.replace(/\/$/, ""));

const corsMw = cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    const o = origin.replace(/\/$/, "");
    if (ALLOW.includes(o)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Idempotency-Key",
    "x-idempotency-key",
  ],
  optionsSuccessStatus: 204,
});

app.use(corsMw);
app.options(/^\/api\/.*$/, corsMw);

// --- Middlewares base ---
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/", seoRoutes);

// --- Rutas con prefijo /api ---
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/publicar", publicarRoutes);
app.use("/api/contact-property", contactPropertyRoutes);

// --- Error handler global (incluye Multer) ---
app.use(
  (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    // Errores específicos de Multer
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          message: "Solo podés subir hasta 30 imágenes por propiedad.",
        });
      }

      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          message:
            "Subiste demasiados archivos o el campo 'images' no es válido.",
        });
      }
    }

    // Otros errores
    console.error("Middleware error:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
);

export default app;
