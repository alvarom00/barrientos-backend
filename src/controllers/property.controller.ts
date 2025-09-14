// controllers/property.controller.ts
import type { Request, Response } from "express";
import mongoose from "mongoose";
import Property from "../models/Property";
import { uploadImageBufferToCloudinary } from "../services/fileStorage";
import { normalizeVideoUrls } from "../utils/videoUrls";
import { v2 as cloudinary } from "cloudinary";
import { customAlphabet } from "nanoid";
import { makeUniqueSlug } from "../utils/slug";
import { notifySearchEngines } from "../utils/searchPing";
import { generateKeywords } from "../utils/keywords";

const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

function siteBase() {
  return (process.env.FRONTEND_ORIGIN || "http://localhost:5173").replace(
    /\/$/,
    ""
  );
}

function propertyUrl(id: string, slug?: string | null) {
  const s = slug ?? undefined;
  return s
    ? `${siteBase()}/properties/${id}/${s}`
    : `${siteBase()}/properties/${id}`;
}

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
    const page = Math.max(parseInt(String(req.query.page ?? 1), 10), 1);
    // acepta pageSize o limit (compatibilidad hacia atrás)
    const pageSizeRaw = req.query.pageSize ?? req.query.limit ?? 10;
    const pageSize = Math.min(
      Math.max(parseInt(String(pageSizeRaw), 10) || 10, 1),
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

    const properties = items.map((p: any) => ({
      ...p,
      imageUrls: (p.images || []).map((i: any) => i.url),
      slug: p.slug, // 👈 por claridad
    }));

    res.json({ properties, total, page, pageSize });
  } catch (err) {
    console.error("getProperties error:", err);
    res.status(500).json({ message: "Error obteniendo propiedades" });
  }
}

/** GET /properties/:idOrSlug */
export async function getPropertyByIdOrSlug(req: Request, res: Response) {
  try {
    const { idOrSlug } = req.params;

    let prop: any = null;
    if (mongoose.isValidObjectId(idOrSlug)) {
      prop = await Property.findById(idOrSlug).lean({ virtuals: true });
    }
    if (!prop) {
      prop = await Property.findOne({ slug: idOrSlug }).lean({
        virtuals: true,
      });
    }
    if (!prop)
      return res.status(404).json({ message: "Propiedad no encontrada" });

    prop.imageUrls = (prop.images || []).map((i: any) => i.url);
    res.json(prop);
  } catch (err) {
    console.error("getPropertyByIdOrSlug error:", err);
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

    // slug único basado en el título (o en el ref si no hay título)
    const titleForSlug = (req.body.title || finalRef) as string;
    const slug = await makeUniqueSlug(Property as any, titleForSlug);

    const keywords = generateKeywords({
      title: req.body.title,
      location: req.body.location,
      operationType: req.body.operationType,
      measure: toNum(req.body.measure),
      propertyType: req.body.propertyType,
    });

    const doc = await Property.create({
      ref: finalRef,
      slug,
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
      houseMeasures: toNum(req.body.houseMeasures),
      services: parseStringArray(req.body.services),
      extras: parseStringArray(req.body.extras),
      images,
      videoUrls,
      keywords,
    });

    const json: any = doc.toJSON({ virtuals: true });
    json.imageUrls = images.map((i) => i.url);

    // 🔔 Ping no bloqueante
    const url = propertyUrl(String(doc._id), doc.slug);
    notifySearchEngines([url]).catch((e) =>
      console.warn("IndexNow create ping error:", e?.message || e)
    );

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

    // --- Mantener / borrar imágenes ---
    const keepImages = parseStringArray(req.body.keepImages);
    const toDelete = (prop.images || []).filter(
      (img: any) => !keepImages.includes(img.url)
    );
    for (const img of toDelete) {
      try {
        await cloudinary.uploader.destroy(img.publicId, {
          resource_type: "image",
        });
      } catch (e) {
        console.warn("No se pudo borrar en Cloudinary:", img.publicId, e);
      }
    }

    let newImages: { url: string; publicId: string }[] = (
      prop.images || []
    ).filter((img: any) => keepImages.includes(img.url));

    const newFiles = (req.files as Express.Multer.File[]) || [];
    for (const f of newFiles) {
      const { secure_url, public_id } = await uploadImageBufferToCloudinary(
        f.buffer,
        f.originalname
      );
      newImages.push({ url: secure_url, publicId: public_id });
    }

    const videoUrls = normalizeVideoUrls(req.body.videoUrls);

    // --- Detectar cambio de título (para slug) ANTES de asignar ---
    const incomingTitle =
      typeof req.body.title === "string" ? req.body.title.trim() : undefined;
    const titleChanged = !!(incomingTitle && incomingTitle !== prop.title);
    const oldSlug = prop.slug;

    // --- Campos ---
    prop.ref =
      (typeof req.body.ref === "string" && req.body.ref.trim()) ||
      prop.ref ||
      (await generateUniqueRef());

    prop.title = incomingTitle ?? prop.title;
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
    prop.houseMeasures = toNum(req.body.houseMeasures) ?? prop.houseMeasures;
    prop.services = parseStringArray(req.body.services);
    prop.extras = parseStringArray(req.body.extras);
    prop.images = newImages;
    prop.videoUrls = videoUrls;

    // --- Regenerar keywords SIEMPRE (barato y evita inconsistencias) ---
    prop.keywords = generateKeywords({
      title: prop.title,
      location: prop.location,
      operationType: prop.operationType,
      measure: prop.measure,
      propertyType: prop.propertyType,
    });

    // --- Regenerar slug si cambió el título ---
    if (titleChanged) {
      prop.slug = await makeUniqueSlug(
        Property as any,
        incomingTitle!,
        prop._id
      );
    }

    await prop.save();

    const json: any = prop.toJSON({ virtuals: true });
    json.imageUrls = (prop.images || []).map((i: any) => i.url);

    // 🔔 Notificar a buscadores (IndexNow/Bing/Google endpoint que uses)
    const urlsToPing = [propertyUrl(String(prop._id), prop.slug)];
    if (titleChanged && oldSlug && oldSlug !== prop.slug) {
      // Notificamos también la URL vieja para que la recrawleen (verán 301/404 según tu manejo)
      urlsToPing.push(propertyUrl(String(prop._id), oldSlug));
    }
    notifySearchEngines(urlsToPing).catch((e) =>
      console.warn("Indexing ping (update) error:", e?.message || e)
    );

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

    // guardamos URL canónica antes de borrar
    const urlToPing = propertyUrl(String(prop._id), prop.slug);

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

    // 🔔 Ping para que la vuelvan a rastrear (verán 404 y la quitarán)
    notifySearchEngines([urlToPing]).catch((e) =>
      console.warn("IndexNow delete ping error:", e?.message || e)
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("deleteProperty error:", err);
    res.status(500).json({ message: "Error eliminando propiedad" });
  }
}
