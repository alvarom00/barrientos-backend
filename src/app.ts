import express from "express";
import cors from "cors";
import morgan from "morgan";
import propertyRoutes from "./routes/property.routes";
import path from "path";
import authRoutes from './routes/auth';
import { sendEmail } from "./utils/sendEmail";
import publicarRoutes from "./routes/publicar";
import contactPropertyRoutes from "./routes/contactProperty";
import dotenv from "dotenv";


dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/properties", propertyRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/publicar", publicarRoutes);
app.use("/api/contact-property", contactPropertyRoutes);

// Ruta de prueba
app.get("/", (_req, res) => {
  res.send("¡Bienvenido al backend de la inmobiliaria!");
});

app.listen(3000, () => console.log("Server listo"));

export default app;
