import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useUiStore } from '@/store/useUiStore';
import { fetchProductBySlug } from '@/api/products';
import { Price } from '@/components/ui/Price';
import { StarRating } from '@/components/ui/StarRating';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { useAddToCart } from '@/hooks/useCart';
import { useEscapeClose } from '@/hooks/useEscapeClose';
import { getOrderedImageUrls, onProductImageError } from '@/utils/productImage';

export function QuickViewModal() {
  const slug = useUiStore((s) => s.quickViewProductSlug);
  const closeQuickView = useUiStore((s) => s.closeQuickView);
  const [quantity, setQuantity] = useState(1);
  const [variantSku, setVariantSku] = useState<string | null>(null);
  const addToCart = useAddToCart();

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug as string),
    enabled: Boolean(slug),
  });

  useEscapeClose(Boolean(slug), closeQuickView);

  if (!slug) return null;

  const product = data?.product;
  const activeVariant = product?.variants.find((v) => v.sku === variantSku);
  const mrp = activeVariant?.mrp ?? product?.mrp ?? 0;
  const salePrice = activeVariant?.salePrice ?? product?.salePrice ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeQuickView}>
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={closeQuickView} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700" aria-label="Close">
          <X size={20} />
        </button>

        {isLoading || !product ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-lg bg-gray-200" />
            <div className="space-y-3">
              <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <img
              src={activeVariant?.images[0] ?? getOrderedImageUrls(product)[0]}
              onError={onProductImageError}
              alt={product.name}
              className="aspect-square w-full rounded-lg object-cover"
            />
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{product.name}</h2>
              <StarRating rating={product.averageRating} reviewCount={product.reviewCount} />
              <Price mrp={mrp} salePrice={salePrice} size="lg" />
              <p className="text-sm text-gray-500">{product.shortDescription}</p>

              {product.variants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.sku}
                      onClick={() => setVariantSku(v.sku)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                        variantSku === v.sku ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      {Object.values(v.attributes).join(' / ')}
                    </button>
                  ))}
                </div>
              )}

              <QuantitySelector quantity={quantity} onChange={setQuantity} />

              <div className="mt-2 flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => addToCart.mutate({ product, variantSku, quantity })}
                  isLoading={addToCart.isPending}
                >
                  Add to Cart
                </Button>
                <Link
                  to={`/products/${product.slug}`}
                  onClick={closeQuickView}
                  className="flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  View Full Product
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
