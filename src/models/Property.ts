import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProperty extends Document {
  title: string;
  description?: string;
  operationType: "Venta" | "Arrendamiento";
  price?: number | null;
  measure: number;
  location: string;
  lat?: number | null;
  lng?: number | null;
  services?: string[];
  extras?: string[];

  // Vivienda (opcionales y condicionales)
  environments?: number | null;
  environmentsList?: string[];
  bedrooms?: number | null;
  bathrooms?: number | null;
  condition?: string | null;
  age?: string | null;
  houseMeasures?: number | null;

  // Media
  imageUrls: string[];   // rutas relativas a /uploads (se mantienen)
  videoUrls: string[];   // 👉 ahora sólo URLs (YouTube/Vimeo/MP4/CDN), no archivos

  createdAt?: Date;
  updatedAt?: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    operationType: { type: String, enum: ["Venta", "Arrendamiento"], required: true },
    price: { type: Number, default: null },
    measure: { type: Number, required: true },
    location: { type: String, required: true, trim: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },

    services: { type: [String], default: [] },
    extras: { type: [String], default: [] },

    environments: { type: Number, default: null },
    environmentsList: { type: [String], default: [] },
    bedrooms: { type: Number, default: null },
    bathrooms: { type: Number, default: null },
    condition: { type: String, default: null },
    age: { type: String, default: null },
    houseMeasures: { type: Number, default: null },

    imageUrls: { type: [String], default: [] },
    videoUrls: { type: [String], default: [] }, // 👈 URL strings
  },
  { timestamps: true }
);

// Índices útiles para listados/búsquedas
PropertySchema.index({ operationType: 1, createdAt: -1 });
PropertySchema.index({ title: "text", location: "text" });

const Property: Model<IProperty> =
  mongoose.models.Property || mongoose.model<IProperty>("Property", PropertySchema);

export default Property;
