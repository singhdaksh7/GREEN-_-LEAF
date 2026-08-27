export type CollectionFilterPatch = {
  minPrice?: string;
  maxPrice?: string;
  inStockOnly?: boolean;
  minRating?: number;
  minDiscount?: number;
};

const PARAMETER_BY_FILTER: Record<keyof CollectionFilterPatch, string> = {
  minPrice: 'minPrice',
  maxPrice: 'maxPrice',
  inStockOnly: 'inStock',
  minRating: 'minRating',
  minDiscount: 'minDiscount',
};

/** Applies only fields included in a filter patch, preserving every other URL filter. */
export function applyCollectionFilterPatch(current: URLSearchParams, patch: CollectionFilterPatch): URLSearchParams {
  const next = new URLSearchParams(current);

  (Object.keys(patch) as Array<keyof CollectionFilterPatch>).forEach((filter) => {
    const value = patch[filter];
    const parameter = PARAMETER_BY_FILTER[filter];
    if (value === undefined || value === '' || value === false || value === 0) {
      next.delete(parameter);
    } else {
      next.set(parameter, String(value));
    }
  });

  next.delete('page');
  return next;
}
