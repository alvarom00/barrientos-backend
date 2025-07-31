import { Schema, model } from "mongoose";

const propertySchema = new Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  location: { type: String, required: true },
  lat: { type: Number },
  lng: { type: Number },
  imageUrls: [String], // URLs de imágenes (podés usar Cloudinary más adelante)
  videoUrl: String, // Video opcional
  available: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export const Property = model("Property", propertySchema);
