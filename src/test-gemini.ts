import "dotenv/config";
import { generateContent } from "./services/AI/gemini.service";

const runTest = async () => {
  try {
    const res = await generateContent({
      prompt: "Escribí una descripción corta de un campo en Argentina para venta",
    });

    console.log("✅ RESPUESTA:\n");
    console.log(res);
  } catch (error) {
    console.error("❌ ERROR:", error);
  }
};

runTest();