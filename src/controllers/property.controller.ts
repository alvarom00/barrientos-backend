import { Request, Response } from "express";
import Property from "../models/Property";
import fs from "node:fs/promises";
import path from "node:path";

// ---------- Helpers

function toArray<T = string>(v: any): T[] {
  if (Array.isArray(v)) return v;
  if (v === undefined || v === null || v === "") return [];
  return [v];
}

function toNumberOrNull(v: any): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isUploadRelativeUrl(u: string) {
  return typeof u === "string" && /^\/?uploads\//i.test(u);
}

async function deleteImageFileIfExists(relUrl: string) {
  // relUrl esperado: "/uploads/images/xxxxx.jpg"
  try {
    const safe = relUrl.replace(/^\/+/, ""); // "uploads/images/xxxxx.jpg"
    // evitamos escapes fuera del dir de trabajo
    const full = path.resolve(process.cwd(), safe);
    // por seguridad, sólo borra dentro de /uploads
    if (!full.includes(path.resolve(process.cwd(), "uploads" + path.sep))) return;
    await fs.unlink(full).catch(() => {});
  } catch {
    // ignorar
  }
}

// ===================================================
//                      Controllers
// ===================================================

export async function getAllProperties(req: Request, res: Response) {
  try {
    const {
      page = "1",
      pageSize = "12",
      search = "",
      operationType,
    } = req.query as Record<string, string>;

    const _page = Math.max(1, parseInt(String(page), 10) || 1);
    const _pageSize = Math.max(1, Math.min(100, parseInt(String(pageSize), 10) || 12));

    const filter: any = {};
    if (operationType && ["Venta", "Arrendamiento"].includes(operationType)) {
      filter.operationType = operationType;
    }
    if (search && search.trim()) {
      // índice de texto recomendado en title/location
      filter.$text = { $search: search.trim() };
    }

    const cursor = Property.find(filter);

    if (filter.$text) {
      // si usamos texto, ordenamos por score
      // @ts-ignore
      cursor.sort({ score: { $meta: "textScore" } });
      // @ts-ignore
      cursor.select({ score: { $meta: "textScore" } });
    } else {
      cursor.sort({ createdAt: -1 });
    }

    const total = await Property.countDocuments(filter);
    const items = await cursor
      .skip((_page - 1) * _pageSize)
      .limit(_pageSize)
      .lean();

    res.json({
      properties: items,
      total,
      page: _page,
      pageSize: _pageSize,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Error listando propiedades" });
  }
}

export async function getPropertyById(req: Request, res: Response) {
  try {
    const item = await Property.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: "Propiedad no encontrada" });
    res.json(item);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Error obteniendo propiedad" });
  }
}

export async function createProperty(req: Request, res: Response) {
  try {
    const body = req.body || {};

    // Normalizar listas
    const services = toArray<string>(body["services[]"] ?? body.services);
    const extras = toArray<string>(body["extras[]"] ?? body.extras);
    const environmentsList = toArray<string>(
      body["environmentsList[]"] ?? body.environmentsList
    );
    const videoUrls = toArray<string>(body["videoUrls[]"] ?? body.videoUrls)
      .map((u) => (u ?? "").trim())
      .filter(Boolean);

    // Imágenes: existentes (none en create) + nuevas subidas
    const files = (req.files as any) || {};
    const imageFiles: Express.Multer.File[] = files.images || [];
    const newImageUrls = imageFiles.map((f) => {
      // tu fileStorage debería guardar en /uploads/images
      return `/uploads/images/${f.filename}`;
    });

    const hasVivienda = extras.includes("Vivienda");

    const doc = await Property.create({
      title: body.title,
      description: body.description ?? "",
      operationType: body.operationType,
      price: toNumberOrNull(body.price),
      measure: Number(body.measure),
      location: body.location,
      lat: toNumberOrNull(body.lat),
      lng: toNumberOrNull(body.lng),

      services,
      extras,

      environments: hasVivienda ? toNumberOrNull(body.environments) : null,
      environmentsList: hasVivienda ? environmentsList.filter(Boolean) : [],
      bedrooms: hasVivienda ? toNumberOrNull(body.bedrooms) : null,
      bathrooms: hasVivienda ? toNumberOrNull(body.bathrooms) : null,
      condition: hasVivienda ? body.condition ?? null : null,
      age: hasVivienda ? body.age ?? null : null,
      houseMeasures: hasVivienda ? toNumberOrNull(body.houseMeasures) : null,

      imageUrls: newImageUrls,      // sólo nuevas (no hay keep en create)
      videoUrls,                    // 👉 URLs (no archivos)
    });

    res.status(201).json(doc);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Error al crear propiedad" });
  }
}

export async function updateProperty(req: Request, res: Response) {
  try {
    const prop = await Property.findById(req.params.id);
    if (!prop) return res.status(404).json({ message: "Propiedad no encontrada" });

    const body = req.body || {};

    // Normalizar listas
    const services = toArray<string>(body["services[]"] ?? body.services);
    const extras = toArray<string>(body["extras[]"] ?? body.extras);
    const environmentsList = toArray<string>(
      body["environmentsList[]"] ?? body.environmentsList
    );
    const videoUrls = toArray<string>(body["videoUrls[]"] ?? body.videoUrls)
      .map((u) => (u ?? "").trim())
      .filter(Boolean);

    // Imágenes: mantener las que vienen en keep + agregar nuevas; borrar las removidas del FS
    const keepImages = toArray<string>(body.keepImages).filter(Boolean);
    const files = (req.files as any) || {};
    const imageFiles: Express.Multer.File[] = files.images || [];
    const newImageUrls = imageFiles.map((f) => `/uploads/images/${f.filename}`);

    // Calcular cuáles borrar del FS (las que estaban antes y ya no están en keep)
    const toDelete = (prop.imageUrls || []).filter(
      (u) => isUploadRelativeUrl(u) && !keepImages.includes(u)
    );
    await Promise.all(toDelete.map((u) => deleteImageFileIfExists(u)));

    const hasVivienda = extras.includes("Vivienda");

    prop.set({
      title: body.title ?? prop.title,
      description: body.description ?? prop.description,
      operationType: body.operationType ?? prop.operationType,
      price:
        body.price !== undefined && body.price !== ""
          ? toNumberOrNull(body.price)
          : prop.price,
      measure:
        body.measure !== undefined && body.measure !== ""
          ? Number(body.measure)
          : prop.measure,
      location: body.location ?? prop.location,
      lat:
        body.lat !== undefined && body.lat !== ""
          ? toNumberOrNull(body.lat)
          : prop.lat,
      lng:
        body.lng !== undefined && body.lng !== ""
          ? toNumberOrNull(body.lng)
          : prop.lng,

      services: services.length ? services : [],
      extras: extras.length ? extras : [],

      environments: hasVivienda
        ? (body.environments !== undefined && body.environments !== ""
            ? toNumberOrNull(body.environments)
            : prop.environments ?? null)
        : null,
      environmentsList: hasVivienda
        ? (environmentsList.length ? environmentsList.filter(Boolean) : [])
        : [],
      bedrooms: hasVivienda
        ? (body.bedrooms !== undefined && body.bedrooms !== ""
            ? toNumberOrNull(body.bedrooms)
            : prop.bedrooms ?? null)
        : null,
      bathrooms: hasVivienda
        ? (body.bathrooms !== undefined && body.bathrooms !== ""
            ? toNumberOrNull(body.bathrooms)
            : prop.bathrooms ?? null)
        : null,
      condition: hasVivienda ? body.condition ?? null : null,
      age: hasVivienda ? body.age ?? null : null,
      houseMeasures: hasVivienda
        ? (body.houseMeasures !== undefined && body.houseMeasures !== ""
            ? toNumberOrNull(body.houseMeasures)
            : prop.houseMeasures ?? null)
        : null,

      imageUrls: [...keepImages, ...newImageUrls],
      videoUrls, // 👉 reemplazamos por lo que viene en el form
    });

    const saved = await prop.save();
    res.json(saved);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Error al actualizar propiedad" });
  }
}

export async function deleteProperty(req: Request, res: Response) {
  try {
    const prop = await Property.findById(req.params.id);
    if (!prop) return res.status(404).json({ message: "Propiedad no encontrada" });

    // Borrar imágenes del FS
    const toDelete = (prop.imageUrls || []).filter(isUploadRelativeUrl);
    await Promise.all(toDelete.map((u) => deleteImageFileIfExists(u)));

    await prop.deleteOne();
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Error al borrar propiedad" });
  }
}
