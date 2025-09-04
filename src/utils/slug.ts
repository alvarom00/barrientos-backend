import type { Model, Types } from "mongoose";

export function slugify(input: string) {
  return (input || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")         // acentos
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90); // longitud razonable
}

// Garantiza unicidad: base, base-2, base-3, ...
export async function makeUniqueSlug<T extends { slug?: string }>(
  Model: Model<T>,
  title: string,
  currentId?: Types.ObjectId | string
): Promise<string> {
  const base = slugify(title) || "propiedad";
  let candidate = base;
  let n = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await Model.exists(
      currentId
        ? { slug: candidate, _id: { $ne: currentId } }
        : { slug: candidate }
    );
    if (!exists) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}
