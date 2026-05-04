// src/services/ai/gemini.service.ts

import { GoogleGenAI } from "@google/genai";

// 🔐 Validación
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("❌ GEMINI_API_KEY no está definida");
}

// 🧠 Cliente
const ai = new GoogleGenAI({ apiKey: API_KEY });

// ⚙️ Modelo correcto (según tu panel)
const MODELS = [
  "gemini-2.5-flash",      // principal
  "gemini-2.5-pro",        // fallback potente
  "gemini-2-flash-lite",   // fallback liviano (CLAVE)
];

// -----------------------------
// 📦 Tipos
// -----------------------------
export interface GenerateContentParams {
  prompt: string;
  model?: string;
}

// -----------------------------
// 🧱 Función base
// -----------------------------
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const generateContent = async ({
  prompt,
}: {
  prompt: string;
}): Promise<string> => {

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Intento ${attempt} con gemini-2.5-flash`);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
      });

      const text = response.text;

      if (text) return text;

    } catch (error: any) {
      console.log("❌ Error:", error?.status);

      if (error?.status !== 503) {
        throw error; // error real
      }

      // espera antes de reintentar
      await sleep(1000 * attempt);
    }
  }

  throw new Error("❌ El modelo está saturado, intentá más tarde");
};