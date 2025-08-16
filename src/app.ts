import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";

import propertyRoutes from "./routes/property.routes";
import authRoutes from "./routes/auth";
import publicarRoutes from "./routes/publicar";
import contactPropertyRoutes from "./routes/contactProperty";

dotenv.config();
const app = express();

const STATIC_ORIGINS = [
  process.env.FRONTEND_ORIGIN,   // p.ej. https://barrientos-frontend.vercel.app
  "http://localhost:5173",
].filter(Boolean) as string[];

const REGEX_ORIGINS = [/\.vercel\.app$/];

app.set("trust proxy", 1);

// 1) CORS primero (global)
const corsMw = cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl/postman/mismo origen
    if (STATIC_ORIGINS.includes(origin)) return cb(null, true);
    if (REGEX_ORIGINS.some((r) => r.test(origin))) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
app.use(corsMw);

// 2) Preflight OPTIONS sin path-to-regexp
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    // corsMw ya puso Access-Control-Allow-Origin
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.status(204).end();
    return;
  }
  next();
});

// 3) Resto de middlewares
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

// 4) Rutas (paths relativos dentro de cada router)
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/publicar", publicarRoutes);
app.use("/api/contact-property", contactPropertyRoutes);

export default app;
