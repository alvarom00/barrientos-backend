import express from "express";
import cors from "cors";
import morgan from "morgan";
import propertyRoutes from "./routes/property.routes";
import path from "path";

const app = express();

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/properties", propertyRoutes);

// Ruta de prueba
app.get("/", (_req, res) => {
  res.send("¡Bienvenido al backend de la inmobiliaria!");
});

app.listen(3000, () => console.log("Server listo"));

export default app;
