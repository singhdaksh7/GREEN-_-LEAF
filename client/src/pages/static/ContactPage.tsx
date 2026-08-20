import { useSettings } from '@/hooks/useSettings';
import { StaticPage } from '@/components/layout/StaticPage';

export function ContactPage() {
  const { data: settings } = useSettings();

  return (
    <StaticPage title="Contact Us">
      <p>We'd love to hear from you. Reach out using any of the details below.</p>
      <ul className="flex flex-col gap-1">
        <li><strong>Email:</strong> {settings?.contactEmail}</li>
        <li><strong>Phone:</strong> {settings?.contactPhone}</li>
        <li><strong>Address:</strong> {settings?.contactAddress}</li>
        <li><strong>Working Hours:</strong> {settings?.workingHours}</li>
      </ul>
    </StaticPage>
  );
}
