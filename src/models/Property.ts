import { customAlphabet } from "nanoid";
import { Schema, model, Document } from "mongoose";

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

export interface IProperty extends Document {
  ref: string;
  title: string;
  description?: string;
  price?: number;
  measure: number;
  location: string;
  lat?: number;
  lng?: number;
  imageUrls: string[];
  videoUrls: string[];
  operationType: string;
  environments?: number;
  bedrooms?: number;
  bathrooms?: number;
  condition?: string;
  age?: string;
  houseMeasures: number;
  environmentsList?: string[];
  services: string[];
  extras: string[];
  resetPasswordToken: string;
  resetPasswordExpires: number;
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
    price: { type: Number },
    measure: { type: Number, required: true },
    location: { type: String, required: true },
    lat: Number,
    lng: Number,
    imageUrls: { type: [String], default: [] },
    videoUrls: { type: [String], default: [] },
    operationType: { type: String, required: true },
    environments: { type: Number },
    environmentsList: { type: [String], default: [] },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    condition: { type: String },
    age: { type: String },
    houseMeasures: { type: Number },
    services: { type: [String], default: [] },
    extras: { type: [String], default: [] },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Number },
  },
  { timestamps: true }
);

export const Property = model<IProperty>("Property", propertySchema);
