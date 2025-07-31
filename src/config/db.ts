import mongoose from "mongoose";

export async function connectDB() {
  try {
    const dbUri = process.env.MONGO_URI || "mongodb://localhost:27017/inmobiliaria";
    await mongoose.connect(dbUri);
    console.log("Conectado a MongoDB");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
    process.exit(1);
  }
}
