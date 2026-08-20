import { Link } from 'react-router-dom';
import { X, Trash2 } from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/hooks/useCart';
import { useEscapeClose } from '@/hooks/useEscapeClose';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatInr } from '@/utils/format';

export function CartDrawer() {
  const isOpen = useUiStore((s) => s.isCartDrawerOpen);
  const close = useUiStore((s) => s.closeCartDrawer);
  const cart = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  useEscapeClose(isOpen, close);

  if (!isOpen) return null;

  const progressPct = Math.min(100, (cart.subtotal / cart.freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="text-base font-semibold text-gray-900">Your Cart ({cart.itemCount})</h2>
          <button onClick={close} aria-label="Close cart" className="focus-ring rounded p-1 text-gray-500 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>

        {cart.amountToFreeShipping > 0 ? (
          <div className="border-b border-gray-100 bg-brand-50 px-4 py-3 text-xs text-brand-800">
            You&apos;re <strong>{formatInr(cart.amountToFreeShipping)}</strong> away from <strong>FREE SHIPPING</strong>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        ) : (
          cart.itemCount > 0 && (
            <div className="border-b border-gray-100 bg-brand-50 px-4 py-3 text-xs font-medium text-brand-800">
              🎉 You’ve unlocked FREE SHIPPING!
            </div>
          )
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {cart.lines.length === 0 ? (
            <EmptyState icon="🌱" title="Your cart is waiting to grow" description="Add some gardening essentials to get started." actionLabel="Shop Now" actionTo="/" />
          ) : (
            <ul className="flex flex-col gap-4">
              {cart.lines.map((line) => (
                <li key={`${line.productId}-${line.variantSku ?? 'base'}`} className="flex gap-3">
                  <Link to={`/products/${line.slug}`} onClick={close} className="shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    <img src={line.image} alt={line.name} className="h-20 w-20 object-contain p-1.5" />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1">
                    <Link to={`/products/${line.slug}`} onClick={close} className="line-clamp-2 text-sm font-medium text-gray-800">
                      {line.name}
                    </Link>
                    {line.variant && (
                      <p className="text-xs text-gray-500">{Object.values(line.variant).join(' / ')}</p>
                    )}
                    <div className="mt-1 flex items-center justify-between">
                      <QuantitySelector
                        size="sm"
                        quantity={line.quantity}
                        onChange={(q) => updateItem.mutate({ productId: line.productId, variantSku: line.variantSku, quantity: q })}
                      />
                      <span className="text-sm font-semibold text-gray-900">{formatInr(line.totalPrice)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem.mutate({ productId: line.productId, variantSku: line.variantSku })}
                    className="self-start text-gray-400 hover:text-red-500"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.lines.length > 0 && (
          <div className="border-t border-gray-100 p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-900">{formatInr(cart.subtotal)}</span>
            </div>
            <div className="flex gap-3">
              <Link
                to="/cart"
                onClick={close}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View Cart
              </Link>
              <Link to="/checkout" onClick={close} className="flex-1">
                <Button className="w-full">Checkout</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
