import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Conectado a MongoDB Atlas");
  } catch (err) {
    console.error("Error conectando a MongoDB:", err);
    process.exit(1);
  }
}
