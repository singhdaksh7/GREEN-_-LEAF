import { Link } from 'react-router-dom';
import { Heart, Eye, ShoppingCart, Star } from 'lucide-react';
import { Product } from '@/types';
import { useAddToCart } from '@/hooks/useCart';
import { useToggleWishlist, useWishlist } from '@/hooks/useWishlist';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/utils/cn';
import { discountPercent, formatInr } from '@/utils/format';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  const { productIds } = useWishlist();
  const openQuickView = useUiStore((s) => s.openQuickView);
  const isSaved = productIds.includes(product._id);
  const isOutOfStock = product.stock <= 0 && product.variants.length === 0;
  const pct = discountPercent(product.mrp, product.salePrice);

  const mainImage = product.images[0];
  const hoverImage = product.images[1] ?? product.images[0];

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-cardHover">
      <Link to={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-gray-50">
        <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
          {pct > 0 && <span className="rounded bg-sale-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{pct}% OFF</span>}
          {product.bestSeller && <span className="rounded bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Bestseller</span>}
          {product.newArrival && <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist.mutate({ productId: product._id, isSaved });
          }}
          className="focus-ring absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-gray-500 shadow-sm transition-colors hover:text-red-500"
          aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={14} className={cn(isSaved && 'fill-red-500 text-red-500')} />
        </button>

        <img
          src={mainImage}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain p-4 transition-opacity duration-300 group-hover:opacity-0 sm:p-6"
        />
        <img
          src={hoverImage}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:p-6"
        />

        {isOutOfStock && (
          <span className="absolute bottom-2 left-2 rounded bg-gray-900/85 px-2 py-1 text-[10px] font-semibold text-white">
            Out of stock
          </span>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            openQuickView(product.slug);
          }}
          className="absolute inset-x-2 bottom-2 hidden translate-y-8 items-center justify-center gap-1.5 rounded-md bg-gray-900/90 py-2 text-[11px] font-medium text-white opacity-0 shadow transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 sm:flex"
        >
          <Eye size={13} /> Quick View
        </button>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-3">
        <Link to={`/products/${product.slug}`} className="line-clamp-2 min-h-[2.5em] text-xs font-medium leading-tight text-gray-800 hover:text-brand-700 sm:text-sm">
          {product.name}
        </Link>

        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Star size={11} className="fill-accent-500 text-accent-500" />
            <span className="font-medium text-gray-700">{product.averageRating.toFixed(1)}</span>
            <span>({product.reviewCount})</span>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-1.5 pt-1">
          <span className="text-sm font-bold text-gray-900 sm:text-base">{formatInr(product.salePrice)}</span>
          {pct > 0 && <span className="text-xs text-gray-400 line-through">{formatInr(product.mrp)}</span>}
        </div>

        <button
          onClick={() => addToCart.mutate({ product, variantSku: null, quantity: 1 })}
          disabled={isOutOfStock || addToCart.isPending}
          className="focus-ring mt-2 flex items-center justify-center gap-1.5 rounded-md border border-brand-600 py-1.5 text-[11px] font-semibold text-brand-700 transition-colors hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 sm:py-2 sm:text-xs"
        >
          <ShoppingCart size={13} />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
