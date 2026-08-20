import { MessageCircle } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

export function WhatsAppButton() {
  const { data: settings } = useSettings();
  const number = settings?.whatsappNumber ?? import.meta.env.VITE_WHATSAPP_NUMBER;

  if (!number) return null;

  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 sm:bottom-5 sm:right-5 sm:h-14 sm:w-14"
    >
      <MessageCircle size={26} />
    </a>
  );
}
