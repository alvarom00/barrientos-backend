import mongoose from "mongoose";
import Property from "../models/Property";
import { makeUniqueSlug } from "../utils/slug";

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const items = await Property.find({ $or: [{ slug: { $exists: false } }, { slug: null }] });
  for (const p of items) {
    // @ts-ignore
    p.slug = await makeUniqueSlug(Property as any, p.title, p._id);
    await p.save();
    console.log("Slug ok →", p._id, p.slug);
  }
  await mongoose.disconnect();
})();