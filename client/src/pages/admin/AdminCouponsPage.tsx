import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Ban } from 'lucide-react';
import { fetchAdminCoupons, createAdminCouponRequest, disableAdminCouponRequest } from '@/api/admin';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/api/axios';

export function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const { data: coupons = [] } = useQuery({ queryKey: ['admin-coupons'], queryFn: fetchAdminCoupons });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'PERCENTAGE', value: 10, minOrderValue: 0, maxDiscount: 0 });

  const createMutation = useMutation({
    mutationFn: createAdminCouponRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon created');
      setShowForm(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not create coupon')),
  });

  const disableMutation = useMutation({
    mutationFn: disableAdminCouponRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon disabled');
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Coupons</h1>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> Add Coupon
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ ...form, maxDiscount: form.maxDiscount || null });
          }}
          className="grid grid-cols-2 gap-3 rounded-xl border border-gray-100 bg-white p-5 sm:grid-cols-5"
        >
          <input required placeholder="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="PERCENTAGE">Percentage</option>
            <option value="FLAT">Flat</option>
            <option value="FREE_SHIPPING">Free Shipping</option>
          </select>
          <input type="number" placeholder="Value" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input type="number" placeholder="Min Order Value" value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: Number(e.target.value) }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input type="number" placeholder="Max Discount" value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: Number(e.target.value) }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <Button type="submit" isLoading={createMutation.isPending} className="col-span-2 sm:col-span-5">Save Coupon</Button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
              <th className="p-3">Code</th>
              <th className="p-3">Type</th>
              <th className="p-3">Value</th>
              <th className="p-3">Used</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c._id} className="border-b border-gray-50">
                <td className="p-3 font-medium">{c.code}</td>
                <td className="p-3">{c.type}</td>
                <td className="p-3">{c.type === 'PERCENTAGE' ? `${c.value}%` : c.type === 'FLAT' ? `₹${c.value}` : '—'}</td>
                <td className="p-3">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                <td className="p-3">{c.isActive ? 'Active' : 'Disabled'}</td>
                <td className="p-3">
                  {c.isActive && (
                    <button onClick={() => disableMutation.mutate(c._id)} className="text-gray-400 hover:text-red-500"><Ban size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
