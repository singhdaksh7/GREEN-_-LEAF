import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, ShieldCheck, RotateCcw, Truck } from 'lucide-react';
import { fetchProductBySlug } from '@/api/products';
import { ProductGallery } from '@/components/product/ProductGallery';
import { Price } from '@/components/ui/Price';
import { StarRating } from '@/components/ui/StarRating';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { DeliveryChecker } from '@/components/product/DeliveryChecker';
import { Tabs } from '@/components/ui/Tabs';
import { ProductReviews } from '@/components/product/ProductReviews';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Seo } from '@/components/seo/Seo';
import { absoluteUrl } from '@/utils/siteUrl';
import { useAddToCart } from '@/hooks/useCart';
import { useToggleWishlist, useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/utils/cn';
import { formatInr } from '@/utils/format';

export function ProductDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [variantSku, setVariantSku] = useState<string | null>(null);
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  const { productIds } = useWishlist();

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug),
  });

  const product = data?.product;
  const activeVariant = useMemo(() => product?.variants.find((v) => v.sku === variantSku) ?? null, [product, variantSku]);

  if (isLoading || !product) {
    return (
      <div className="container-app py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-gray-200" />
          <div className="space-y-3">
            <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  const isSaved = productIds.includes(product._id);
  const images = activeVariant?.images.length ? activeVariant.images : product.images;
  const mrp = activeVariant?.mrp ?? product.mrp;
  const salePrice = activeVariant?.salePrice ?? product.salePrice;
  const stock = activeVariant?.stock ?? product.stock;
  const isOutOfStock = stock <= 0;

  const variantsByAttribute: Record<string, Set<string>> = {};
  for (const v of product.variants) {
    for (const [key, val] of Object.entries(v.attributes)) {
      variantsByAttribute[key] = variantsByAttribute[key] ?? new Set();
      variantsByAttribute[key].add(val);
    }
  }

  const categoryName = typeof product.category === 'object' ? product.category.name : '';

  return (
    <div className="container-app pb-24 pt-5 sm:pb-8 sm:pt-8">
      <Seo
        title={product.name}
        description={product.shortDescription}
        image={product.images[0]}
        type="product"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            image: product.images,
            description: product.shortDescription,
            sku: product.sku,
            offers: { '@type': 'Offer', price: salePrice, priceCurrency: 'INR', availability: isOutOfStock ? 'OutOfStock' : 'InStock' },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
              ...(categoryName ? [{ '@type': 'ListItem', position: 2, name: categoryName }] : []),
              { '@type': 'ListItem', position: categoryName ? 3 : 2, name: product.name, item: absoluteUrl(`/products/${product.slug}`) },
            ],
          },
        ]}
      />

      <nav className="mb-4 text-xs text-gray-500">
        <Link to="/">Home</Link> <span className="mx-1">/</span>
        {categoryName && (
          <>
            <span>{categoryName}</span> <span className="mx-1">/</span>
          </>
        )}
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={images} alt={product.name} />

        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <StarRating rating={product.averageRating} reviewCount={product.reviewCount} />
            <span className="text-xs text-gray-400">SKU: {activeVariant?.sku ?? product.sku}</span>
          </div>

          <div className="mt-4">
            <Price mrp={mrp} salePrice={salePrice} size="lg" />
            {mrp > salePrice && (
              <p className="mt-1 text-xs font-medium text-brand-700">
                You Save {formatInr(mrp - salePrice)} &middot; <span className="text-gray-400">Inclusive of all taxes</span>
              </p>
            )}
          </div>

          <p className="mt-3 text-sm text-gray-600">{product.shortDescription}</p>

          <p className={cn('mt-3 text-sm font-medium', isOutOfStock ? 'text-red-600' : stock <= 5 ? 'text-accent-600' : 'text-brand-700')}>
            {isOutOfStock ? 'Out of stock' : stock <= 5 ? `Only ${stock} left in stock` : 'In stock'}
          </p>

          {Object.entries(variantsByAttribute).map(([attr, values]) => (
            <div key={attr} className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">{attr}</h3>
              <div className="flex flex-wrap gap-2">
                {[...values].map((val) => {
                  const matchingVariant = product.variants.find((v) => v.attributes[attr] === val);
                  const isActive = activeVariant?.attributes[attr] === val;
                  const isVariantOutOfStock = (matchingVariant?.stock ?? 0) <= 0;
                  return (
                    <button
                      key={val}
                      disabled={isVariantOutOfStock}
                      onClick={() => matchingVariant && setVariantSku(matchingVariant.sku)}
                      className={cn(
                        'focus-ring relative rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                        isActive
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : isVariantOutOfStock
                            ? 'border-gray-200 text-gray-300 line-through'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      )}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-5 flex items-center gap-4">
            <QuantitySelector quantity={quantity} onChange={setQuantity} max={stock || 99} />
            <button
              onClick={() => toggleWishlist.mutate({ productId: product._id, isSaved })}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-500"
            >
              <Heart size={18} className={cn(isSaved && 'fill-red-500 text-red-500')} /> Wishlist
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              disabled={isOutOfStock}
              isLoading={addToCart.isPending}
              onClick={() => addToCart.mutate({ product, variantSku, quantity })}
            >
              Add to Cart
            </Button>
            <Button
              className="flex-1"
              disabled={isOutOfStock}
              onClick={async () => {
                await addToCart.mutateAsync({ product, variantSku, quantity });
                navigate('/checkout');
              }}
            >
              Buy Now
            </Button>
          </div>

          <div className="mt-6">
            <DeliveryChecker />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-gray-500 sm:grid-cols-3">
            <span className="flex items-center gap-1.5"><Truck size={14} /> Pan India shipping</span>
            <span className="flex items-center gap-1.5"><RotateCcw size={14} /> 7-day easy returns</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Quality assured</span>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <Tabs
          tabs={[
            { id: 'description', label: 'Description', content: <p className="max-w-3xl text-sm leading-relaxed text-gray-600">{product.description}</p> },
            {
              id: 'specifications',
              label: 'Specifications',
              content: (
                <table className="w-full max-w-lg text-sm">
                  <tbody>
                    <tr className="border-b border-gray-100"><td className="py-2 text-gray-500">Brand</td><td className="py-2 font-medium text-gray-800">{product.brand}</td></tr>
                    <tr className="border-b border-gray-100"><td className="py-2 text-gray-500">SKU</td><td className="py-2 font-medium text-gray-800">{product.sku}</td></tr>
                    <tr className="border-b border-gray-100"><td className="py-2 text-gray-500">Category</td><td className="py-2 font-medium text-gray-800">{categoryName}</td></tr>
                  </tbody>
                </table>
              ),
            },
            { id: 'how-to-use', label: 'How to Use', content: <p className="max-w-3xl text-sm leading-relaxed text-gray-600">{product.howToUse ?? 'No usage instructions provided.'}</p> },
            { id: 'shipping', label: 'Shipping', content: <p className="max-w-3xl text-sm leading-relaxed text-gray-600">We ship pan-India. Standard delivery takes 3-7 business days depending on your location. Free shipping is available on orders above the free shipping threshold.</p> },
            { id: 'returns', label: 'Return Policy', content: <p className="max-w-3xl text-sm leading-relaxed text-gray-600">Products can be returned within 7 days of delivery if unused and in original packaging. Perishable items like seeds and fertilizers cannot be returned once opened.</p> },
            {
              id: 'reviews',
              label: `Reviews (${product.reviewCount})`,
              content: (
                <ProductReviews
                  productId={product._id}
                  initialReviews={data?.reviews ?? []}
                  averageRating={product.averageRating}
                  reviewCount={product.reviewCount}
                />
              ),
            },
          ]}
        />
      </div>

      {data && data.related.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-6 font-display text-xl font-bold text-gray-900">You May Also Like</h2>
          <ProductGrid products={data.related} />
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:hidden">
        <div className="shrink-0">
          <p className="text-base font-bold text-gray-900">{formatInr(salePrice)}</p>
          {mrp > salePrice && <p className="text-[11px] text-gray-400 line-through">{formatInr(mrp)}</p>}
        </div>
        <button
          onClick={() => addToCart.mutate({ product, variantSku, quantity })}
          disabled={isOutOfStock || addToCart.isPending}
          className="focus-ring flex-1 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white disabled:bg-brand-300"
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
