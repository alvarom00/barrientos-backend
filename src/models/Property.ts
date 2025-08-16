import { Schema, model } from "mongoose";

const ImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const PropertySchema = new Schema(
  {
    ref: { type: String, unique: true, sparse: true },
    title: { type: String, required: true },
    description: String,
    price: Number,
    measure: { type: Number, required: true },
    location: { type: String, required: true },
    lat: Number,
    lng: Number,

    // 👇 NUEVO: guardamos objetos con url + publicId
    images: { type: [ImageSchema], default: [] },

    // seguimos guardando los videos como URLs
    videoUrls: { type: [String], default: [] },

    propertyType: String,
    operationType: { type: String, enum: ["Venta", "Arrendamiento"] },
    environments: Number,
    bedrooms: Number,
    bathrooms: Number,
    condition: String,
    age: String,
    houseMeasures: String,
    environmentsList: [String],
    services: [String],
    extras: [String],
  },
  { timestamps: true }
);

// Virtual para que el front reciba imageUrls: string[]
PropertySchema.virtual("imageUrls").get(function () {
  return (this.images || []).map((i: any) => i.url);
});

PropertySchema.set("toJSON", { virtuals: true });
PropertySchema.set("toObject", { virtuals: true });

export default model("Property", PropertySchema);
