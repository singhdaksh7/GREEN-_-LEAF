import { useSettings } from '@/hooks/useSettings';

export function AnnouncementBar() {
  const { data: settings } = useSettings();

  return (
    <div className="bg-brand-800 py-2 text-center text-xs font-medium text-white sm:text-sm">
      {settings?.announcementText ?? 'Free Shipping on Orders Above ₹999'}
    </div>
  );
}
