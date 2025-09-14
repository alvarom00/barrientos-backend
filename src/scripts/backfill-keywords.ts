import "dotenv/config";
import mongoose from "mongoose";
import Property from "../models/Property";
import { generateKeywords } from "../utils/keywords";

(async () => {
  const uri = process.env.MONGODB_URI!;
  await mongoose.connect(uri);
  const cur = Property.find({}).cursor();

  let done = 0;
  for await (const p of cur) {
    const before = (p as any).keywords || [];
    const kw = generateKeywords({
      title: (p as any).title,
      location: (p as any).location,
      operationType: (p as any).operationType,
      measure: (p as any).measure,
      propertyType: (p as any).propertyType,
    });
    const changed = JSON.stringify(kw) !== JSON.stringify(before);
    if (changed) {
      (p as any).keywords = kw;
      await p.save();
      console.log("✅ keywords actualizadas:", p._id.toString(), kw.slice(0, 5).join(" | "), "…");
    } else {
      console.log("• sin cambios:", p._id.toString());
    }
    done++;
  }

  console.log(`Listo. ${done} propiedades procesadas.`);
  await mongoose.disconnect();
})();
