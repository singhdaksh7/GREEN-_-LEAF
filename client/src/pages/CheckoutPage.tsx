import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/seo/Seo';
import { formatInr } from '@/utils/format';
import { placeOrderRequest } from '@/api/orders';
import { createRazorpayOrderRequest, verifyRazorpayPaymentRequest } from '@/api/payments';
import { validateCouponRequest, CouponValidation } from '@/api/coupons';
import { fetchAddresses } from '@/api/account';
import { getErrorMessage } from '@/api/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { loadRazorpayScript } from '@/utils/razorpay';
import { RazorpayFailureResponse, RazorpaySuccessResponse } from '@/types/razorpay';

const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  addressLine: z.string().min(1, 'Address is required'),
  locality: z.string().min(1, 'Locality is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(4, 'Pincode is required'),
});

type AddressForm = z.infer<typeof addressSchema>;

export function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [isPayingOnline, setIsPayingOnline] = useState(false);

  const { data: addresses = [] } = useQuery({ queryKey: ['addresses'], queryFn: fetchAddresses });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { fullName: user?.name ?? '', email: user?.email ?? '', phone: '' },
  });

  const couponMutation = useMutation({
    mutationFn: validateCouponRequest,
    onSuccess: (data) => {
      setAppliedCoupon(data);
      toast.success('Coupon applied successfully');
    },
    onError: (error) => {
      setAppliedCoupon(null);
      toast.error(getErrorMessage(error, 'Invalid coupon'));
    },
  });

  const placeOrder = useMutation({
    mutationFn: placeOrderRequest,
    onSuccess: (order) => {
      toast.success('Order placed successfully!');
      navigate(`/account/orders/${order._id}`, { state: { justPlaced: true } });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not place order')),
  });

  function applyAddress(id: string) {
    const addr = addresses.find((a) => a._id === id);
    if (!addr) return;
    setValue('fullName', addr.fullName);
    setValue('phone', addr.phone);
    setValue('addressLine', addr.addressLine);
    setValue('locality', addr.locality);
    setValue('city', addr.city);
    setValue('state', addr.state);
    setValue('pincode', addr.pincode);
  }

  const discount = appliedCoupon?.discount ?? 0;
  const shipping = appliedCoupon?.freeShipping ? 0 : cart.shipping;
  const grandTotal = Math.max(0, cart.subtotal - discount + shipping);

  async function payOnline(values: AddressForm) {
    if (isPayingOnline) return;
    setIsPayingOnline(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      toast.error('Could not load the payment gateway. Please check your connection and try again.');
      setIsPayingOnline(false);
      return;
    }

    let initData;
    try {
      initData = await createRazorpayOrderRequest({
        shippingAddress: values,
        couponCode: appliedCoupon?.code ?? null,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not start online payment'));
      setIsPayingOnline(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: initData.keyId,
      amount: initData.amount,
      currency: initData.currency,
      name: initData.name,
      description: 'GreenKart order payment',
      order_id: initData.orderId,
      prefill: { name: values.fullName, email: values.email, contact: values.phone },
      theme: { color: '#16a34a' },
      handler: (response: RazorpaySuccessResponse) => {
        verifyRazorpayPaymentRequest(response)
          .then((order) => {
            toast.success('Payment successful! Order placed.');
            navigate(`/account/orders/${order._id}`, { state: { justPlaced: true } });
          })
          .catch((error) => {
            toast.error(
              getErrorMessage(
                error,
                'Payment verification failed. If the amount was deducted, please contact support with your payment ID.'
              )
            );
          })
          .finally(() => setIsPayingOnline(false));
      },
      modal: {
        ondismiss: () => setIsPayingOnline(false),
      },
    });

    rzp.on('payment.failed', (response: RazorpayFailureResponse) => {
      toast.error(response.error?.description || 'Payment failed. Please try again.');
      setIsPayingOnline(false);
    });

    rzp.open();
  }

  function onSubmit(values: AddressForm) {
    if (paymentMethod === 'ONLINE') {
      void payOnline(values);
      return;
    }
    placeOrder.mutate({
      shippingAddress: values,
      paymentMethod,
      couponCode: appliedCoupon?.code ?? null,
    });
  }

  useEffect(() => {
    if (!cart.isLoading && cart.lines.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cart.isLoading, cart.lines.length, navigate]);

  if (cart.isLoading) {
    return (
      <div className="container-app py-8">
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return null;
  }

  return (
    <div className="container-app py-8">
      <Seo title="Checkout" />
      <h1 className="mb-6 font-display text-2xl font-bold text-gray-900">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          {addresses.length > 0 && (
            <div className="rounded-xl border border-gray-100 p-5">
              <h2 className="mb-3 text-base font-semibold text-gray-900">Saved Addresses</h2>
              <div className="flex flex-wrap gap-2">
                {addresses.map((addr) => (
                  <button
                    key={addr._id}
                    type="button"
                    onClick={() => applyAddress(addr._id)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-left text-xs text-gray-600 hover:border-brand-500"
                  >
                    {addr.fullName}, {addr.city} - {addr.pincode}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-100 p-5">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Contact Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="mb-1 block text-xs font-medium text-gray-600">Full Name</label>
                <input id="fullName" {...register('fullName')} placeholder="Full Name" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-600">Email</label>
                <input id="email" {...register('email')} placeholder="Email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="phone" className="mb-1 block text-xs font-medium text-gray-600">Mobile Number</label>
                <input id="phone" {...register('phone')} placeholder="Mobile Number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 p-5">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Shipping Address</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="addressLine" className="mb-1 block text-xs font-medium text-gray-600">Address Line</label>
                <input id="addressLine" {...register('addressLine')} placeholder="Address Line" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {errors.addressLine && <p className="mt-1 text-xs text-red-500">{errors.addressLine.message}</p>}
              </div>
              <div>
                <label htmlFor="locality" className="mb-1 block text-xs font-medium text-gray-600">Locality</label>
                <input id="locality" {...register('locality')} placeholder="Locality" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {errors.locality && <p className="mt-1 text-xs text-red-500">{errors.locality.message}</p>}
              </div>
              <div>
                <label htmlFor="city" className="mb-1 block text-xs font-medium text-gray-600">City</label>
                <input id="city" {...register('city')} placeholder="City" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
              </div>
              <div>
                <label htmlFor="state" className="mb-1 block text-xs font-medium text-gray-600">State</label>
                <input id="state" {...register('state')} placeholder="State" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>}
              </div>
              <div>
                <label htmlFor="pincode" className="mb-1 block text-xs font-medium text-gray-600">Pincode</label>
                <input id="pincode" {...register('pincode')} placeholder="Pincode" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {errors.pincode && <p className="mt-1 text-xs text-red-500">{errors.pincode.message}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 p-5">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Payment</h2>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                Cash on Delivery
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="radio" checked={paymentMethod === 'ONLINE'} onChange={() => setPaymentMethod('ONLINE')} />
                Pay Online (Cards, UPI, Netbanking)
              </label>
            </div>
          </div>
        </div>

        <div className="h-fit rounded-xl border border-gray-100 p-5 lg:sticky lg:top-24">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Order Summary</h2>

          <ul className="mb-4 flex flex-col gap-3">
            {cart.lines.map((line) => (
              <li key={`${line.productId}-${line.variantSku ?? 'base'}`} className="flex items-center gap-3 text-sm">
                <img src={line.image} alt={line.name} className="h-12 w-12 rounded-lg object-cover" />
                <span className="flex-1 truncate">{line.name} × {line.quantity}</span>
                <span className="font-medium">{formatInr(line.totalPrice)}</span>
              </li>
            ))}
          </ul>

          <div className="mb-4 flex gap-2">
            <label htmlFor="couponCode" className="sr-only">Coupon code</label>
            <input
              id="couponCode"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => couponInput && couponMutation.mutate(couponInput)}
              disabled={couponMutation.isPending}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
            >
              Apply
            </button>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatInr(cart.subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="mt-2 flex justify-between text-sm text-brand-700">
              <span>Coupon Discount ({appliedCoupon?.code})</span>
              <span>-{formatInr(discount)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free' : formatInr(shipping)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-base font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatInr(grandTotal)}</span>
          </div>

          <Button type="submit" className="mt-5 w-full" isLoading={placeOrder.isPending || isPayingOnline}>
            {paymentMethod === 'ONLINE' ? 'Pay Now' : 'Place Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}
