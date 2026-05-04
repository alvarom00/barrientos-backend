import { Request, Response } from "express";
import { generateContent } from "../services/AI/gemini.service";
import { AIOptimizeResponse } from "../types/ai.types";

export const optimizeDescription = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      location,
      measure,
      operationType,
      previousSuggestions = [],
    } = req.body;

    // 🧠 Validación básica
    if (!description) {
      return res.status(400).json({
        error: "La descripción es obligatoria",
      });
    }

    const safeDescription = JSON.stringify(description);

    // 🧠 Prompt (provisoriamente simple, lo mejoramos después)
    const prompt = `
Actúa como experto en SEO inmobiliario rural en Argentina.

Tu tarea es mejorar la descripción de una propiedad para:
- posicionamiento en Google
- mayor conversión

Reglas:
- Mantener la esencia y formato de la descripción original
- Incluir palabras clave relevantes (campo, venta, ubicación, medida, etc.)
- Ser claro, atractivo y profesional
- Evitar exageraciones o información falsa
- Solamente asegurarse de mejorar el SEO, no de reescribir completamente.

IMPORTANTE:
- Generar una versión distinta a las anteriores:
${previousSuggestions.join("\n")}

Responder SOLO en JSON válido con este formato:

{
  "optimized": "texto mejorado",
  "alternatives": ["opcion 1", "opcion 2"]
}

Datos:
Título: ${title}
Ubicación: ${location}
Hectáreas: ${measure}
Operación: ${operationType}

Descripción:
${safeDescription}
`;

    const result = await generateContent({ prompt });

    // 🔥 Extraer JSON
    const match = result.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("No se pudo parsear JSON");
    }

    const data = JSON.parse(match[0]) as AIOptimizeResponse;

    return res.json(data);
  } catch (error) {
    console.error("❌ AI Controller Error:", error);

    return res.status(500).json({
      error: "Error generando sugerencia",
    });
  }
};
