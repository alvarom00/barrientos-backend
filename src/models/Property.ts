import { Schema, model } from "mongoose";
import { makeUniqueSlug } from "../utils/slug";

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
    houseMeasures: String,
    services: [String],
    extras: [String],
    slug: { type: String, index: true, unique: true, sparse: true },
  },
  { timestamps: true }
);

// Virtual para que el front reciba imageUrls: string[]
PropertySchema.virtual("imageUrls").get(function () {
  return (this.images || []).map((i: any) => i.url);
});

// Hook pre-save (cuando cambia el título)
PropertySchema.pre("save", async function (next) {
  if (this.isModified("title")) {
    // @ts-ignore
    this.slug = await makeUniqueSlug(this.constructor, this.title, this._id);
  }
  next();
});

// Hook para findOneAndUpdate (cuando actualizas por PUT)
PropertySchema.pre("findOneAndUpdate", async function (next) {
  const update: any = this.getUpdate() || {};
  if (update.title) {
    const Model: any = this.model; // el propio modelo
    const doc = await Model.findOne(this.getQuery()).select("_id");
    if (doc) {
      update.slug = await makeUniqueSlug(Model, update.title, doc._id);
      this.setUpdate(update);
    }
  }
  next();
});

PropertySchema.set("toJSON", { virtuals: true });
PropertySchema.set("toObject", { virtuals: true });

export default model("Property", PropertySchema);
