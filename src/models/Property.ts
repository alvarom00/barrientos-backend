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
  operationType: string;
  environments: number;
  bedrooms: number;
  bathrooms: number;
  condition: string;
  age: string;
  measuresList: string[];
  environmentsList: string[];
  services: string[];
  extras: string[];
  floor?: string;
  apartmentNumber?: string;
  pricePerDay?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
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
    operationType: { type: String, required: true },
    environments: { type: Number, required: true },
    environmentsList: { type: [String], default: [] },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number },
    condition: { type: String },
    age: { type: String, required: true },
    measuresList: { type: [String], required: true },
    services: { type: [String], default: [] },
    extras: { type: [String], default: [] },
    floor: { type: String },
    apartmentNumber: { type: String },
    pricePerDay: { type: Number },
    pricePerWeek: { type: Number },
    pricePerMonth: { type: Number },
  },
  { timestamps: true }
);

export const Property = model<IProperty>("Property", propertySchema);
