// app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import { sendEmail } from "./utils/sendEmail";
import propertyRoutes from "./routes/property.routes";
import authRoutes from "./routes/auth";
import publicarRoutes from "./routes/publicar";
import contactPropertyRoutes from "./routes/contactProperty";

dotenv.config();
const app = express();

app.set("trust proxy", 1);

/**
 * Orígenes permitidos:
 * - Producción (apex y www)
 * - Localhost para dev
 * Si quieres permitir previews de Vercel, agrega un regex opcional abajo.
 */
// app.ts (fragmento CORS)
const ORIGINS_RAW = [
  process.env.FRONTEND_ORIGIN, // https://camposbarrientos.com
  process.env.FRONTEND_ORIGIN_WWW, // https://www.camposbarrientos.com
  "http://localhost:5173",
].filter(Boolean) as string[];

const ALLOW = ORIGINS_RAW.map((o) => o.replace(/\/$/, "")); // sin trailing slash

const corsMw = cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    const o = origin.replace(/\/$/, "");
    if (ALLOW.includes(o)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Idempotency-Key",
    "x-idempotency-key",
  ],
});
app.use(corsMw);

// Si quieres responder explícitamente solo los preflight de tu API:
app.options(/^\/api\/.*$/, corsMw);

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Rutas
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/publicar", publicarRoutes);
app.use("/api/contact-property", contactPropertyRoutes);

export default app;
