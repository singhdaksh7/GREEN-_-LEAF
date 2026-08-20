import { useQuery } from '@tanstack/react-query';
import { fetchCategoryTree } from '@/api/categories';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategoryTree,
    staleTime: 5 * 60 * 1000,
  });
}
