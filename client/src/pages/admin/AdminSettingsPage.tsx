import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useSettings } from '@/hooks/useSettings';
import { updateAdminSettingsRequest } from '@/api/admin';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/api/axios';

export function AdminSettingsPage() {
  const { data: settings } = useSettings();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    announcementText: '', freeShippingThreshold: 999, standardShippingFee: 79,
    whatsappNumber: '', contactEmail: '', contactPhone: '', contactAddress: '', workingHours: '',
  });

  useEffect(() => {
    if (settings) {
      setForm({
        announcementText: settings.announcementText,
        freeShippingThreshold: settings.freeShippingThreshold,
        standardShippingFee: settings.standardShippingFee,
        whatsappNumber: settings.whatsappNumber,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        contactAddress: settings.contactAddress,
        workingHours: settings.workingHours,
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: updateAdminSettingsRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not update settings')),
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-gray-900">Site Settings</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
        className="grid max-w-2xl grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-white p-5 sm:grid-cols-2"
      >
        <input placeholder="Announcement Text" value={form.announcementText} onChange={(e) => setForm((f) => ({ ...f, announcementText: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
        <input type="number" placeholder="Free Shipping Threshold" value={form.freeShippingThreshold} onChange={(e) => setForm((f) => ({ ...f, freeShippingThreshold: Number(e.target.value) }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input type="number" placeholder="Standard Shipping Fee" value={form.standardShippingFee} onChange={(e) => setForm((f) => ({ ...f, standardShippingFee: Number(e.target.value) }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="WhatsApp Number" value={form.whatsappNumber} onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Contact Email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Contact Phone" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Working Hours" value={form.workingHours} onChange={(e) => setForm((f) => ({ ...f, workingHours: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Contact Address" value={form.contactAddress} onChange={(e) => setForm((f) => ({ ...f, contactAddress: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
        <Button type="submit" isLoading={mutation.isPending} className="sm:col-span-2">Save Settings</Button>
      </form>
    </div>
  );
}
