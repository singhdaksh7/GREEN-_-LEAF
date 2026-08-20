import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/hooks/useCart';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Seo } from '@/components/seo/Seo';
import { formatInr } from '@/utils/format';

export function CartPage() {
  const cart = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const navigate = useNavigate();

  if (cart.lines.length === 0 && !cart.isLoading) {
    return (
      <div className="container-app py-16">
        <EmptyState icon="🌱" title="Your cart is waiting to grow" description="Browse our collections and add some gardening essentials." actionLabel="Shop Now" actionTo="/" />
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <Seo title="Your Cart" />
      <h1 className="mb-6 font-display text-2xl font-bold text-gray-900">Your Cart</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-400">
                <th className="pb-3">Product</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Quantity</th>
                <th className="pb-3">Total</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody>
              {cart.lines.map((line) => (
                <tr key={`${line.productId}-${line.variantSku ?? 'base'}`} className="border-b border-gray-100">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                        <img src={line.image} alt={line.name} className="h-full w-full object-contain p-1" />
                      </div>
                      <div>
                        <Link to={`/products/${line.slug}`} className="font-medium text-gray-800 hover:text-brand-700">
                          {line.name}
                        </Link>
                        {line.variant && <p className="text-xs text-gray-500">{Object.values(line.variant).join(' / ')}</p>}
                        {!line.inStock && <p className="text-xs font-medium text-red-600">Insufficient stock</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">{formatInr(line.unitPrice)}</td>
                  <td className="py-4">
                    <QuantitySelector
                      size="sm"
                      quantity={line.quantity}
                      max={line.stock}
                      onChange={(q) => updateItem.mutate({ productId: line.productId, variantSku: line.variantSku, quantity: q })}
                    />
                  </td>
                  <td className="py-4 font-semibold text-gray-900">{formatInr(line.totalPrice)}</td>
                  <td className="py-4">
                    <button
                      onClick={() => removeItem.mutate({ productId: line.productId, variantSku: line.variantSku })}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="h-fit rounded-xl border border-gray-100 p-5 lg:sticky lg:top-24">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Order Summary</h2>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatInr(cart.subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span>{cart.shipping === 0 ? 'Free' : formatInr(cart.shipping)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-base font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatInr(cart.subtotal + cart.shipping)}</span>
          </div>
          <Button className="mt-5 w-full" onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
