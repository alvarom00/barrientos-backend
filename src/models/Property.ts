import { customAlphabet } from "nanoid";
import { Schema, model, Document } from "mongoose";

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

export interface IProperty extends Document {
  ref: string;
  title: string;
  description?: string;
  price: number;
  location: string;
  lat?: number;
  lng?: number;
  imageUrls: string[];
  videoUrls: string[];
  propertyType: string;
  environments: number;
  bedrooms: number;
  bathrooms: number;
  condition: string;
  age: string;
  measuresList: string[];
  environmentsList: string[];
  services: string[];
  extras: string[];
}

const propertySchema = new Schema<IProperty>(
  {
    ref: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(),
    },
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    location: { type: String, required: true },
    lat: Number,
    lng: Number,
    imageUrls: { type: [String], default: [] },

    videoUrls: { type: [String], default: [] },

    propertyType: { type: String, required: true },
    environments: { type: Number, required: true },

    // definimos la lista de ambientes
    environmentsList: { type: [String], default: [] },

    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    condition: { type: String, required: true },
    age: { type: String, required: true },
    measuresList: { type: [String], required: true },
    services: { type: [String] },
    extras: { type: [String] },
  },
  { timestamps: true }
);

export const Property = model<IProperty>("Property", propertySchema);
