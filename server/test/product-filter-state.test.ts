import { describe, expect, it } from 'vitest';
import { emptyCollectionFilters, filtersFromSearchParams, writeFilters } from '../../client/src/utils/productFilters';

describe('collection filter URL state', () => {
  it('keeps minimum and maximum prices independently', () => {
    const filters = filtersFromSearchParams(new URLSearchParams('minPrice=400&maxPrice=1200'));
    expect(filters.minPrice).toBe('400');
    expect(filters.maxPrice).toBe('1200');
  });

  it('supports AND across filter groups and OR within an attribute', () => {
    const filters = filtersFromSearchParams(new URLSearchParams('subcategory=pots&minPrice=400&attr_color=White,Black&minRating=4'));
    expect(filters.subcategory).toEqual(['pots']);
    expect(filters.attributes.color).toEqual(['White', 'Black']);
    expect(filters.minRating).toBe(4);
  });

  it('preserves existing selections when a rating is updated', () => {
    const params = new URLSearchParams('minPrice=400&maxPrice=1200&attr_color=White');
    const filters = filtersFromSearchParams(params);
    writeFilters(params, { ...filters, minRating: 4 });
    expect(params.toString()).toContain('minPrice=400');
    expect(params.toString()).toContain('maxPrice=1200');
    expect(params.toString()).toContain('attr_color=White');
    expect(params.toString()).toContain('minRating=4');
  });

  it('removes only the requested attribute and clears all filters safely', () => {
    const params = new URLSearchParams('subcategory=pots&minPrice=400&attr_color=White,Black');
    const filters = filtersFromSearchParams(params);
    writeFilters(params, { ...filters, attributes: { color: ['Black'] } });
    expect(params.get('subcategory')).toBe('pots');
    expect(params.get('minPrice')).toBe('400');
    expect(params.get('attr_color')).toBe('Black');
    writeFilters(params, emptyCollectionFilters());
    expect(params.toString()).toBe('');
  });
});
