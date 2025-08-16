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

const STATIC_ORIGINS = [
  process.env.FRONTEND_ORIGIN, // p.ej. https://barrientos-frontend.vercel.app
  "http://localhost:5173",
].filter(Boolean) as string[];

const REGEX_ORIGINS = [/\.vercel\.app$/];

app.set("trust proxy", 1);

// --- CORS (primero y SIN cortar nosotros el OPTIONS) ---
const corsMw = cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (STATIC_ORIGINS.includes(origin)) return cb(null, true);
    if (REGEX_ORIGINS.some((r) => r.test(origin))) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  // Opción A (recomendado): reflejar lo que pide el browser (no setear allowedHeaders)
  // allowedHeaders: undefined,

  // Opción B (explícito): lista blanca incluyendo el idempotency key
  allowedHeaders: ["Content-Type", "Authorization", "x-idempotency-key"],
});
app.use(corsMw);
// Si querés manejar OPTIONS explícito, hacelo así para que cors ponga todos los headers:
app.options("*", corsMw);

// --- Middlewares restantes ---
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/health-email", async (_req, res) => {
  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: "Prueba SendGrid ✅",
      html: "<p>Hola! Esto es un test de SendGrid desde Render.</p>",
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: "Ver logs de servidor" });
  }
});

// --- Rutas ---
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/publicar", publicarRoutes);
app.use("/api/contact-property", contactPropertyRoutes);

export default app;
