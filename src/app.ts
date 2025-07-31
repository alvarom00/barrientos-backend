import express from "express";
import cors from "cors";
import morgan from "morgan";
import propertyRoutes from "./routes/property.routes";

const app = express();

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/properties", propertyRoutes);

// Ruta de prueba
app.get("/", (_req, res) => {
  res.send("¡Bienvenido al backend de la inmobiliaria!");
});

export default app;
