import { Accordion } from '@/components/ui/Accordion';

const FAQS = [
  { question: 'Do you offer free shipping?', answer: 'Yes! Orders above ₹999 qualify for free shipping across India.' },
  { question: 'How long does delivery take?', answer: 'Most orders are delivered within 3-7 business days depending on your location.' },
  { question: 'Do you deliver throughout India?', answer: 'Yes, we deliver pan-India. You can check serviceability using our pincode checker on any product page.' },
  { question: 'Can products be returned?', answer: 'Yes, most products can be returned within 7 days of delivery if unused and in original packaging.' },
  { question: 'How do I choose the correct planter?', answer: 'Consider the plant\'s root size and drainage needs. As a rule of thumb, pick a pot 2-4 inches larger than the root ball.' },
  { question: 'What soil is suitable for indoor plants?', answer: 'A well-draining potting mix with perlite or cocopeat works best for most indoor plants.' },
  { question: 'Which tools are useful for beginners?', answer: 'A hand trowel, pruning shears, and a watering can are great starter tools for any home gardener.' },
];

export function FaqSection() {
  return (
    <section className="container-app py-12">
      <h2 className="mb-6 text-center font-display text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
      <div className="mx-auto max-w-2xl">
        <Accordion items={FAQS} />
      </div>
    </section>
  );
}
