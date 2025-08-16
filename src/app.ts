import express from "express";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import { sendEmail } from "./utils/sendEmail";
// import path from "node:path"; // <- descomenta si vas a servir /uploads

import propertyRoutes from "./routes/property.routes";
import authRoutes from "./routes/auth";
import publicarRoutes from "./routes/publicar";
import contactPropertyRoutes from "./routes/contactProperty";

dotenv.config();

const app = express();

const STATIC_ORIGINS = [
  process.env.FRONTEND_ORIGIN,         // p.ej. https://barrientos-frontend.vercel.app
  "http://localhost:5173",
].filter(Boolean) as string[];

const REGEX_ORIGINS = [/\.vercel\.app$/];

app.set("trust proxy", 1);

// ---------- CORS (global + preflights) ----------
const corsConfig: CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl/postman/mismo origen
    if (STATIC_ORIGINS.includes(origin)) return cb(null, true);
    if (REGEX_ORIGINS.some((r) => r.test(origin))) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Idempotency-Key", // <-- necesario para tu header custom
  ],
  credentials: true,
  maxAge: 86400,
};

app.use(cors(corsConfig));
// Responder todos los preflights con los headers correctos
app.options("*", cors(corsConfig));

// ---------- Middlewares ----------
app.use(
  helmet({
    // evita que CORP bloquee recursos que cargás desde otro origen
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));

// Si servís imágenes subidas en disco, habilitá /uploads
// app.use("/uploads", express.static(path.resolve("uploads")));

// ---------- Salud ----------
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/health-email", async (_req, res) => {
  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: "Prueba SendGrid ✅",
      html: "<p>Hola! Esto es un test de SendGrid desde Render.</p>",
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Ver logs de servidor" });
  }
});

// ---------- Rutas ----------
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/publicar", publicarRoutes);
app.use("/api/contact-property", contactPropertyRoutes);

export default app;
