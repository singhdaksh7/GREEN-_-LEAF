import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Truck, Users, Percent, ClipboardList } from 'lucide-react';
import { submitBulkOrderRequest, BulkOrderPayload } from '@/api/bulkOrders';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/seo/Seo';
import { getErrorMessage } from '@/api/axios';

const emptyForm: BulkOrderPayload = {
  fullName: '', company: '', email: '', mobile: '', pincode: '', product: '', quantity: 1, targetPrice: undefined,
  expectedPurchaseDate: '', requirement: '', message: '',
};

const BENEFITS = [
  { icon: Percent, label: 'Volume Pricing' },
  { icon: Truck, label: 'Pan India Delivery' },
  { icon: Users, label: 'Dedicated Business Support' },
  { icon: ClipboardList, label: 'Large Project Requirements' },
];

export function BulkOrdersPage() {
  const [form, setForm] = useState<BulkOrderPayload>(emptyForm);
  const mutation = useMutation({
    mutationFn: submitBulkOrderRequest,
    onSuccess: () => {
      toast.success('Enquiry submitted! Our team will reach out shortly.');
      setForm(emptyForm);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not submit enquiry')),
  });

  function update<K extends keyof BulkOrderPayload>(key: K, value: BulkOrderPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div>
      <Seo title="Bulk Orders" description="Request a bulk order quote for gardening supplies." />
      <section className="bg-brand-800 py-12 text-center text-white">
        <div className="container-app">
          <span className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-brand-200">For Businesses &amp; Institutions</span>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Buying in Bulk?</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-brand-100">Get customised pricing for large gardening orders — societies, corporates, landscapers and events.</p>
        </div>
      </section>

      <div className="container-app grid grid-cols-2 gap-4 py-8 sm:grid-cols-4">
        {BENEFITS.map((b) => (
          <div key={b.label} className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <b.icon size={22} />
            </div>
            <span className="text-xs font-medium text-gray-700">{b.label}</span>
          </div>
        ))}
      </div>

      <div className="container-app max-w-2xl pb-12">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
        className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 p-5 sm:grid-cols-2"
      >
        <input required placeholder="Full Name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Company (optional)" value={form.company} onChange={(e) => update('company', e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input required placeholder="Mobile" value={form.mobile} onChange={(e) => update('mobile', e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input required placeholder="Pincode" value={form.pincode} onChange={(e) => update('pincode', e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Product" value={form.product} onChange={(e) => update('product', e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input required type="number" min={1} placeholder="Quantity" value={form.quantity} onChange={(e) => update('quantity', Number(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input type="number" min={0} placeholder="Target Price (₹)" value={form.targetPrice ?? ''} onChange={(e) => update('targetPrice', e.target.value ? Number(e.target.value) : undefined)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input type="date" placeholder="Expected Purchase Date" value={form.expectedPurchaseDate} onChange={(e) => update('expectedPurchaseDate', e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
        <textarea placeholder="Requirement details" value={form.requirement} onChange={(e) => update('requirement', e.target.value)} rows={3} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
        <textarea placeholder="Additional message" value={form.message} onChange={(e) => update('message', e.target.value)} rows={2} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
        <Button type="submit" isLoading={mutation.isPending} className="sm:col-span-2">
          Submit Enquiry
        </Button>
      </form>
      </div>
    </div>
  );
}
