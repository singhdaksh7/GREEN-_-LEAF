import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchAdminBulkOrders, updateAdminBulkOrderStatusRequest } from '@/api/admin';
import { formatDate } from '@/utils/format';

interface AdminBulkOrder {
  _id: string;
  fullName: string;
  company?: string;
  email: string;
  mobile: string;
  product?: string;
  quantity: number;
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'QUOTED', 'CONVERTED', 'CLOSED'];

export function AdminBulkOrdersPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-bulk-orders'], queryFn: () => fetchAdminBulkOrders() });
  const inquiries = (data ?? []) as unknown as AdminBulkOrder[];

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAdminBulkOrderStatusRequest(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bulk-orders'] });
      toast.success('Status updated');
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-gray-900">Bulk Order Enquiries</h1>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
              <th className="p-3">Name</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Product</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inq) => (
              <tr key={inq._id} className="border-b border-gray-50">
                <td className="p-3">{inq.fullName}{inq.company ? ` (${inq.company})` : ''}</td>
                <td className="p-3 text-gray-500">{inq.email}<br />{inq.mobile}</td>
                <td className="p-3">{inq.product ?? '—'}</td>
                <td className="p-3">{inq.quantity}</td>
                <td className="p-3 text-gray-500">{formatDate(inq.createdAt)}</td>
                <td className="p-3">
                  <select
                    value={inq.status}
                    onChange={(e) => statusMutation.mutate({ id: inq._id, status: e.target.value })}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
