import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();
const app = express();

const STATIC_ORIGINS = [
  process.env.FRONTEND_ORIGIN,   // ej: https://barrientos-frontend.vercel.app
  "http://localhost:5173",
].filter(Boolean) as string[];

const REGEX_ORIGINS = [/\.vercel\.app$/];

app.set("trust proxy", 1);

// 👉 CORS PRIMERO
const corsMw = cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl/postman o misma máquina
    if (STATIC_ORIGINS.includes(origin)) return cb(null, true);
    if (REGEX_ORIGINS.some((r) => r.test(origin))) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

app.use(corsMw);
// 🟢 Express 5: NO usar "*". Usar "/(.*)".
app.options("/(.*)", corsMw);

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Rutas montadas en /api/...
import propertyRoutes from "./routes/property.routes";
import authRoutes from "./routes/auth";
import publicarRoutes from "./routes/publicar";
import contactPropertyRoutes from "./routes/contactProperty";

app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/publicar", publicarRoutes);
app.use("/api/contact-property", contactPropertyRoutes);

export default app;
