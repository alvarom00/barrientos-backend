import { Request, Response } from "express";
import { Property } from "../models/Property";

interface MulterFiles {
  images?: Express.Multer.File[];
  videos?: Express.Multer.File[];
}

export const getAllProperties = async (req: Request, res: Response) => {
  try {
    const { operationType, query } = req.query;

    // Armamos el filtro dinámico
    const filter: any = {};

    if (operationType) filter.operationType = operationType;
    if (query) {
      filter.$or = [
        { location: { $regex: query, $options: "i" } },
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        // Agregá más campos si querés buscar en más lugares
      ];
    }

    const properties = await Property.find(filter);
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving properties", error });
  }
};

export const createProperty = async (req: Request, res: Response) => {
  try {
    const imageFiles = (req.files && (req.files as any).images) || [];
    const videoFiles = (req.files && (req.files as any).videos) || [];
    const imageUrls = imageFiles.map(
      (file: any) => `/uploads/images/${file.filename}`
    );
    const videoUrls = videoFiles.map(
      (file: any) => `/uploads/videos/${file.filename}`
    );
    const files = req.files as MulterFiles;
    const {
      title,
      description,
      price,
      measure,
      location,
      lat,
      lng,
      operationType,
      services,
      extras,
      environments,
      environmentsList,
      bedrooms,
      bathrooms,
      condition,
      age,
      houseMeasures,
      keepImageUrls,
      keepVideoUrls,
    } = req.body;
    const propertyData = {
      title,
      description,
      price: price ? Number(price) : undefined,
      measure: measure ? Number(measure) : undefined,
      location,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      operationType,
      services: Array.isArray(services) ? services : services ? [services] : [],
      extras: Array.isArray(extras) ? extras : extras ? [extras] : [],
      environments: environments ? Number(environments) : undefined,
      environmentsList: Array.isArray(environmentsList)
        ? environmentsList
        : environmentsList
        ? [environmentsList]
        : [],
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      condition,
      age,
      houseMeasures,
      imageUrls,
      videoUrls,
    };
    if (propertyData.price) propertyData.price = Number(propertyData.price);
    if (propertyData.measure)
      propertyData.measure = Number(propertyData.measure);
    if (typeof propertyData.services === "string")
      propertyData.services = [propertyData.services];
    if (typeof propertyData.extras === "string")
      propertyData.extras = [propertyData.extras];
    const newProperty = new Property(propertyData);
    const savedProperty = await newProperty.save();
    res.status(201).json(savedProperty);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error creating property", error });
  }
};

export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: "Error fetching property", error });
  }
};

export const updateProperty = async (req: Request, res: Response) => {
  try {
    const files = req.files as MulterFiles;
    // Notar que los campos ahora se llaman keepImages y keepVideos (plural)
    const {
      title,
      description,
      price,
      measure,
      location,
      lat,
      lng,
      operationType,
      services,
      extras,
      environments,
      environmentsList,
      bedrooms,
      bathrooms,
      condition,
      age,
      houseMeasures,
      keepImages, // importante, plural!
      keepVideos,
    } = req.body;

    const property = await Property.findById(req.params.id);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    // Siempre convertir a array
    const keepImageArr = Array.isArray(keepImages)
      ? keepImages
      : keepImages
      ? [keepImages]
      : [];

    const keepVideoArr = Array.isArray(keepVideos)
      ? keepVideos
      : keepVideos
      ? [keepVideos]
      : [];

    const newImages = files.images
      ? files.images.map((file) => `/uploads/${file.filename}`)
      : [];
    const newVideos = files.videos
      ? files.videos.map((file) => `/uploads/${file.filename}`)
      : [];

    const imageUrls = [...keepImageArr, ...newImages];
    const videoUrls = [...keepVideoArr, ...newVideos];

    const updateData = {
      title,
      description,
      price,
      measure,
      location,
      lat,
      lng,
      operationType,
      services,
      extras,
      environments,
      environmentsList,
      bedrooms,
      bathrooms,
      condition,
      age,
      houseMeasures,
      imageUrls,
      videoUrls,
    };

    const updated = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating property:", error);
    res
      .status(500)
      .json({
        message: "Error updating property",
        error: error.message || error,
      });
  }
};

export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const deleted = await Property.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting property", error });
  }
};
