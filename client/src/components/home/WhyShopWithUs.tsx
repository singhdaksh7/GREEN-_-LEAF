import { Truck, ShieldCheck, Lock, RotateCcw, Headphones } from 'lucide-react';

const REASONS = [
  { icon: Truck, title: 'Pan India Delivery', description: 'We deliver gardening essentials to every corner of India.' },
  { icon: ShieldCheck, title: 'Quality Assured', description: 'Every product is checked for premium quality before shipping.' },
  { icon: Lock, title: 'Secure Payments', description: 'Your transactions are encrypted and completely secure.' },
  { icon: RotateCcw, title: 'Easy Returns', description: 'Hassle-free returns within 7 days of delivery.' },
  { icon: Headphones, title: 'Customer Support', description: 'Our gardening experts are here to help, always.' },
];

export function WhyShopWithUs() {
  return (
    <section className="bg-brand-50 py-12">
      <div className="container-app">
        <h2 className="mb-8 text-center font-display text-2xl font-bold text-gray-900">Why Shop With Us</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {REASONS.map((reason) => (
            <div key={reason.title} className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-600 shadow-card">
                <reason.icon size={26} />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">{reason.title}</h3>
              <p className="text-xs text-gray-500">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
