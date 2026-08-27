import { describe, expect, it } from 'vitest';
import { applyCollectionFilterPatch } from './collectionFilters';

describe('applyCollectionFilterPatch', () => {
  it('preserves minimum and maximum prices when both are set', () => {
    const afterMinimum = applyCollectionFilterPatch(new URLSearchParams(), { minPrice: '400' });
    const afterMaximum = applyCollectionFilterPatch(afterMinimum, { maxPrice: '1200' });

    expect(afterMaximum.toString()).toBe('minPrice=400&maxPrice=1200');
  });

  it('changes the minimum without clearing the maximum', () => {
    const params = new URLSearchParams('minPrice=400&maxPrice=1200');
    expect(applyCollectionFilterPatch(params, { minPrice: '500' }).toString()).toBe('minPrice=500&maxPrice=1200');
  });

  it('clears only the maximum price', () => {
    const params = new URLSearchParams('minPrice=500&maxPrice=1200');
    expect(applyCollectionFilterPatch(params, { maxPrice: '' }).toString()).toBe('minPrice=500');
  });

  it('preserves both inputs when maximum is set before minimum', () => {
    const afterMaximum = applyCollectionFilterPatch(new URLSearchParams(), { maxPrice: '1200' });
    expect(applyCollectionFilterPatch(afterMaximum, { minPrice: '400' }).toString()).toBe('maxPrice=1200&minPrice=400');
  });

  it('restores independent values from URL search parameters', () => {
    const params = new URLSearchParams('minPrice=400&maxPrice=1200');
    expect(params.get('minPrice')).toBe('400');
    expect(params.get('maxPrice')).toBe('1200');
  });
});
