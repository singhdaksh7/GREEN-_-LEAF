import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
  question: string;
  answer: string;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-800"
            >
              {item.question}
              <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <p className="px-5 pb-4 text-sm text-gray-500">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
