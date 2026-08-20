import { useWishlist } from '@/hooks/useWishlist';
import { ProductGrid } from '@/components/product/ProductGrid';
import { EmptyState } from '@/components/ui/EmptyState';

export function WishlistPage() {
  const { products, isLoading, isAuthenticated } = useWishlist();

  if (!isAuthenticated) {
    return <EmptyState icon="💚" title="Log in to view your wishlist" description="Your saved items sync across devices once you log in." actionLabel="Login" actionTo="/login" />;
  }

  if (!isLoading && products.length === 0) {
    return <EmptyState icon="💚" title="You haven't saved any gardening favourites yet." actionLabel="Explore Products" actionTo="/" />;
  }

  return <ProductGrid products={products} isLoading={isLoading} />;
}
