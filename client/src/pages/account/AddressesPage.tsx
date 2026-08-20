import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { fetchAddresses, createAddressRequest, deleteAddressRequest, AddressInput } from '@/api/account';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { getErrorMessage } from '@/api/axios';

const emptyForm: AddressInput = {
  fullName: '', phone: '', addressLine: '', locality: '', city: '', state: '', pincode: '', isDefault: false,
};

export function AddressesPage() {
  const queryClient = useQueryClient();
  const { data: addresses = [], isLoading } = useQuery({ queryKey: ['addresses'], queryFn: fetchAddresses });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressInput>(emptyForm);

  const createMutation = useMutation({
    mutationFn: createAddressRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address added');
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not save address')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddressRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address deleted');
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Saved Addresses</h2>
        <Button size="sm" variant="outline" onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> Add Address
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 p-4 sm:grid-cols-2"
        >
          {(['fullName', 'phone', 'addressLine', 'locality', 'city', 'state', 'pincode'] as const).map((field) => (
            <input
              key={field}
              required
              placeholder={field.replace(/([A-Z])/g, ' $1')}
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              className={`rounded-lg border border-gray-300 px-3 py-2 text-sm ${field === 'addressLine' ? 'sm:col-span-2' : ''}`}
            />
          ))}
          <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
            Set as default address
          </label>
          <Button type="submit" isLoading={createMutation.isPending} className="sm:col-span-2">
            Save Address
          </Button>
        </form>
      )}

      {!isLoading && addresses.length === 0 && !showForm ? (
        <EmptyState icon="📍" title="No saved addresses" description="Add an address for faster checkout." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr._id} className="rounded-xl border border-gray-100 p-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">{addr.fullName}</p>
                {addr.isDefault && <span className="text-xs font-medium text-brand-700">Default</span>}
              </div>
              <p className="text-sm text-gray-600">{addr.addressLine}, {addr.locality}</p>
              <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
              <p className="text-sm text-gray-600">{addr.phone}</p>
              <button onClick={() => deleteMutation.mutate(addr._id)} className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:underline">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
