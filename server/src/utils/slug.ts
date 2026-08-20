import slugify from 'slugify';
import { Model } from 'mongoose';

export function toSlug(text: string): string {
  return slugify(text, { lower: true, strict: true });
}

export async function generateUniqueSlug<T>(model: Model<T>, text: string, excludeId?: string): Promise<string> {
  const base = toSlug(text);
  let slug = base;
  let counter = 1;

  for (;;) {
    const query: Record<string, unknown> = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await model.findOne(query);
    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
}
