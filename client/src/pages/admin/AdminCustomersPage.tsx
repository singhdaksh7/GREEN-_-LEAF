import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminCustomers, setCustomerActiveRequest } from '@/api/admin';

export function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-customers', page, q], queryFn: () => fetchAdminCustomers({ page, q: q || undefined }) });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setCustomerActiveRequest(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-customers'] }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-gray-900">Customers</h1>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers..." className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {data?.customers.map((c) => (
              <tr key={c.id} className="border-b border-gray-50">
                <td className="p-3">{c.firstName} {c.lastName}</td>
                <td className="p-3 text-gray-500">{c.email}</td>
                <td className="p-3 text-gray-500">{c.phone}</td>
                <td className="p-3">{(c as unknown as { isActive: boolean }).isActive ? 'Active' : 'Disabled'}</td>
                <td className="p-3">
                  <button
                    onClick={() => toggleActive.mutate({ id: c.id, isActive: !(c as unknown as { isActive: boolean }).isActive })}
                    className="text-xs font-medium text-brand-700 hover:underline"
                  >
                    {(c as unknown as { isActive: boolean }).isActive ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`h-8 w-8 rounded-lg text-sm ${p === page ? 'bg-brand-600 text-white' : 'text-gray-600'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
