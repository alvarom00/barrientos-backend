export type KWInput = {
  title?: string;
  location?: string;
  operationType?: "Venta" | "Arrendamiento" | string;
  measure?: number | null;
  propertyType?: string | null;
};

const STOP = new Set([
  "el","la","los","las","de","del","y","o","a","en","con","para","por",
  "km","kms","m2","m²","ha","hectareas","hectáreas","un","una","unos","unas",
  "al","lo","su","sus","tu","tus","mi","mis","que","es","al","se","u$s","usd"
]);

function dedupe(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const k = s.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(s.trim());
  }
  return out;
}

function norm(s?: string) {
  if (!s) return "";
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function wordsFromTitle(t?: string) {
  if (!t) return [];
  return norm(t)
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .split(/\s+/)
    .filter(w => w && !STOP.has(w) && w.length > 2)
    .slice(0, 10);
}

function placesFromLocation(loc?: string) {
  if (!loc) return [];
  return norm(loc)
    .split(/[,\-\/|>]/)
    .map(s => s.trim())
    .filter(Boolean);
}

function opVariants(op?: string) {
  const o = (op || "").toLowerCase();
  if (o.includes("arrend")) {
    return ["arrendamiento","alquiler","arriendo","en alquiler","en arriendo"];
  }
  return ["venta","en venta","comprar","venta de campos"];
}

export function generateKeywords(input: KWInput): string[] {
  const { title, location, operationType, measure, propertyType } = input;

  const places = placesFromLocation(location);           
  const titleWords = wordsFromTitle(title);              
  const ops = opVariants(operationType);                 

  const baseNouns = ["campo","campos","campo rural","campo agricola","campo ganadero","chacra","estancia"];
  const maybeType = propertyType ? [norm(propertyType)] : [];

  const sizeBits = typeof measure === "number" && measure > 0
    ? [`${measure} ha`, `${measure} hectareas`]
    : [];

  const combos: string[] = [];

  for (const p of places) {
    for (const o of ops) {
      combos.push(`campo ${o} ${p}`);
      combos.push(`campos ${o} ${p}`);
      combos.push(`${o} de campo ${p}`);
      combos.push(`${o} de campos ${p}`);
    }
  }

  for (const p of places) {
    for (const n of [...baseNouns, ...maybeType]) {
      if (!n) continue;
      combos.push(`${n} ${p}`);
      combos.push(`${n} en ${p}`);
    }
  }

  if (sizeBits.length) {
    for (const p of places) {
      for (const s of sizeBits) {
        combos.push(`campo ${s} ${p}`);
        combos.push(`campo ${s} en ${p}`);
        for (const o of ops) combos.push(`campo ${s} ${o} ${p}`);
      }
    }
  }

  for (const p of places) {
    for (let i = 0; i < titleWords.length; i++) {
      const a = titleWords[i];
      if (a === "campo" || a === "campos") continue;
      combos.push(`campo ${a} ${p}`);
      if (i + 1 < titleWords.length) {
        const b = titleWords[i + 1];
        combos.push(`campo ${a} ${b} ${p}`);
      }
    }
  }

  combos.push(...ops.map(o => `campo ${o}`));
  combos.push(...baseNouns);

  return dedupe(combos).slice(0, 60);
}
