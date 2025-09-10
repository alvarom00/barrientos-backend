import "dotenv/config";
import mongoose from "mongoose";
import Property from "../models/Property";
import { notifySearchEngines } from "../utils/searchPing";

function siteBase() {
  return (process.env.FRONTEND_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
}
function buildUrl(id: string, slug?: string | null) {
  const s = slug ?? undefined;
  return s ? `${siteBase()}/properties/${id}/${s}` : `${siteBase()}/properties/${id}`;
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

(async () => {
  const uri = process.env.MONGODB_URI!;
  await mongoose.connect(uri);

  const props = await Property.find({})
    .select("_id slug updatedAt")
    .sort({ updatedAt: -1 })
    .lean();

  const urls = props.map(p => buildUrl(String((p as any)._id), (p as any).slug));

  console.log(`Pinging ${urls.length} URLs via IndexNow…`);
  // Hazlo en tandas para ser amable con el servicio
  const BATCH = 100;
  for (let i = 0; i < urls.length; i += BATCH) {
    const chunk = urls.slice(i, i + BATCH);
    try {
      // Tu helper acepta arrays; si aceptara de a 1, reemplaza por un bucle por URL
      await notifySearchEngines(chunk);
      console.log(`OK ${i + chunk.length}/${urls.length}`);
    } catch (e: any) {
      console.warn("Chunk failed:", e?.message || e);
      // fallback: intenta de a una
      for (const u of chunk) {
        try {
          await notifySearchEngines([u]);
          console.log("OK", u);
          await sleep(300);
        } catch (err: any) {
          console.warn("FAIL", u, err?.message || err);
        }
      }
    }
    await sleep(1500);
  }

  await mongoose.disconnect();
  console.log("Done.");
})();
