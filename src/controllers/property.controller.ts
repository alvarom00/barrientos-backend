import type { Request, Response } from "express";
import Property from "../models/Property";
import { uploadImageBufferToCloudinary } from "../services/fileStorage";
import { normalizeVideoUrls } from "../utils/videoUrls";
import { v2 as cloudinary } from "cloudinary";
import { customAlphabet } from "nanoid";

const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

async function generateUniqueRef() {
  let ref = "";
  do {
    ref = `BARR-${new Date().getFullYear()}-${nano()}`;
  } while (await Property.exists({ ref }));
  return ref;
}

/** helpers parse */
function toNum(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}
function parseStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** GET /properties */
export async function getProperties(req: Request, res: Response) {
  try {
    const page = Math.max(parseInt(String(req.query.page || 1), 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(String(req.query.pageSize || 10), 10), 1),
      50
    );

    const search = String(req.query.search || "").trim();
    const operationType = String(req.query.operationType || "").trim();

    const filters: any = {};
    if (operationType) filters.operationType = operationType;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filters.$or = [
        { ref: rx },
        { title: rx },
        { location: rx },
        { description: rx },
      ];
    }

    const [items, total] = await Promise.all([
      Property.find(filters)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean({ virtuals: true }),
      Property.countDocuments(filters),
    ]);

    // devolvemos imageUrls virtual + todo lo demás
    const properties = items.map((p: any) => ({
      ...p,
      imageUrls: (p.images || []).map((i: any) => i.url),
    }));

    res.json({ properties, total });
  } catch (err) {
    console.error("getProperties error:", err);
    res.status(500).json({ message: "Error obteniendo propiedades" });
  }
}

/** GET /properties/:id */
export async function getPropertyById(req: Request, res: Response) {
  try {
    const prop: any = await Property.findById(req.params.id).lean({
      virtuals: true,
    });
    if (!prop)
      return res.status(404).json({ message: "Propiedad no encontrada" });

    prop.imageUrls = (prop.images || []).map((i: any) => i.url);
    res.json(prop);
  } catch (err) {
    console.error("getPropertyById error:", err);
    res.status(500).json({ message: "Error obteniendo la propiedad" });
  }
}

/** POST /properties  (usa uploadImages.array('images')) */
export async function createProperty(req: Request, res: Response) {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const images: { url: string; publicId: string }[] = [];
    const ref = req.body.ref?.trim();
    const finalRef = ref && ref.length > 0 ? ref : await generateUniqueRef();

    for (const f of files) {
      const { secure_url, public_id } = await uploadImageBufferToCloudinary(
        f.buffer,
        f.originalname
      );
      images.push({ url: secure_url, publicId: public_id });
    }

    const videoUrls = normalizeVideoUrls(req.body.videoUrls);

    const doc = await Property.create({
      ref: finalRef,
      title: req.body.title,
      description: req.body.description,
      price: toNum(req.body.price),
      measure: toNum(req.body.measure)!,
      location: req.body.location,
      lat: toNum(req.body.lat),
      lng: toNum(req.body.lng),
      propertyType: req.body.propertyType,
      operationType: req.body.operationType,
      environments: toNum(req.body.environments),
      bedrooms: toNum(req.body.bedrooms),
      bathrooms: toNum(req.body.bathrooms),
      condition: req.body.condition,
      age: req.body.age,
      houseMeasures: parseStringArray(req.body.houseMeasures),
      environmentsList: parseStringArray(req.body.environmentsList),
      services: parseStringArray(req.body.services),
      extras: parseStringArray(req.body.extras),
      images, // 👈 guardamos objetos con publicId
      videoUrls, // 👈 solo URLs
    });

    const json: any = doc.toJSON({ virtuals: true });
    json.imageUrls = images.map((i) => i.url);
    res.status(201).json(json);
  } catch (err) {
    console.error("createProperty error:", err);
    res.status(500).json({ message: "Error creando propiedad" });
  }
}

/** PUT /properties/:id  (usa uploadImages.array('images')) */
export async function updateProperty(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const prop: any = await Property.findById(id);
    if (!prop)
      return res.status(404).json({ message: "Propiedad no encontrada" });

    // URLs que el front quiere mantener (vienen como keepImages)
    const keepImages = parseStringArray(req.body.keepImages);

    // determinar cuáles borrar en Cloudinary (las que existen pero no están en keep)
    const toDelete = (prop.images || []).filter(
      (img: any) => !keepImages.includes(img.url)
    );

    // borrar en Cloudinary
    for (const img of toDelete) {
      try {
        await cloudinary.uploader.destroy(img.publicId, {
          resource_type: "image",
        });
      } catch (e) {
        console.warn("No se pudo borrar en Cloudinary:", img.publicId, e);
      }
    }

    // mantener las que quedan
    let newImages: { url: string; publicId: string }[] = (
      prop.images || []
    ).filter((img: any) => keepImages.includes(img.url));

    // agregar nuevas subidas
    const newFiles = (req.files as Express.Multer.File[]) || [];
    for (const f of newFiles) {
      const { secure_url, public_id } = await uploadImageBufferToCloudinary(
        f.buffer,
        f.originalname
      );
      newImages.push({ url: secure_url, publicId: public_id });
    }

    const videoUrls = normalizeVideoUrls(req.body.videoUrls);

    prop.ref =
      (typeof req.body.ref === "string" && req.body.ref.trim()) ||
      prop.ref ||
      (await generateUniqueRef());
    prop.title = req.body.title ?? prop.title;
    prop.description = req.body.description ?? prop.description;
    prop.price = toNum(req.body.price);
    prop.measure = toNum(req.body.measure) ?? prop.measure;
    prop.location = req.body.location ?? prop.location;
    prop.lat = toNum(req.body.lat);
    prop.lng = toNum(req.body.lng);
    prop.propertyType = req.body.propertyType ?? prop.propertyType;
    prop.operationType = req.body.operationType ?? prop.operationType;
    prop.environments = toNum(req.body.environments);
    prop.bedrooms = toNum(req.body.bedrooms);
    prop.bathrooms = toNum(req.body.bathrooms);
    prop.condition = req.body.condition ?? prop.condition;
    prop.age = req.body.age ?? prop.age;
    prop.houseMeasures = parseStringArray(req.body.houseMeasures);
    prop.environmentsList = parseStringArray(req.body.environmentsList);
    prop.services = parseStringArray(req.body.services);
    prop.extras = parseStringArray(req.body.extras);
    prop.images = newImages;
    prop.videoUrls = videoUrls;
    await prop.save();

    const json: any = prop.toJSON({ virtuals: true });
    json.imageUrls = (prop.images || []).map((i: any) => i.url);
    res.json(json);
  } catch (err) {
    console.error("updateProperty error:", err);
    res.status(500).json({ message: "Error actualizando propiedad" });
  }
}

/** DELETE /properties/:id  (borra imágenes en Cloudinary) */
export async function deleteProperty(req: Request, res: Response) {
  try {
    const prop: any = await Property.findById(req.params.id);
    if (!prop)
      return res.status(404).json({ message: "Propiedad no encontrada" });

    // borrar todas las imágenes en Cloudinary
    for (const img of prop.images || []) {
      try {
        await cloudinary.uploader.destroy(img.publicId, {
          resource_type: "image",
        });
      } catch (e) {
        console.warn("No se pudo borrar en Cloudinary:", img.publicId, e);
      }
    }

    await prop.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error("deleteProperty error:", err);
    res.status(500).json({ message: "Error eliminando propiedad" });
  }
}
