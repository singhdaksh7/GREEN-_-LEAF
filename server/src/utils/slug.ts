import slugify from 'slugify';

export function toSlug(text: string): string {
  return slugify(text, { lower: true, strict: true });
}

/**
 * `slugExists` should resolve `true` if the given slug is already taken by
 * some OTHER row (the caller is responsible for excluding the row currently
 * being updated, if any).
 */
export async function generateUniqueSlug(text: string, slugExists: (slug: string) => Promise<boolean>): Promise<string> {
  const base = toSlug(text);
  let slug = base;
  let counter = 1;

  for (;;) {
    const exists = await slugExists(slug);
    if (!exists) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
}
