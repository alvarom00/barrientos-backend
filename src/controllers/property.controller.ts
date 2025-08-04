import { Request, Response } from "express";
import { Property } from "../models/Property";

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
        { description: { $regex: query, $options: "i" } }
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
    // Tomamos el body y calculamos el número de ambientes
    const data = { ...req.body };

    const newProperty = new Property(data);
    const savedProperty = await newProperty.save();
    res.status(201).json(savedProperty);
  } catch (error) {
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
    // Preparamos los datos para update, recalculando ambientes
    const data = { ...req.body };

    const updated = await Property.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating property", error });
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
