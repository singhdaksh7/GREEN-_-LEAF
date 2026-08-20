import { ReactNode, useState } from 'react';
import { cn } from '@/utils/cn';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors',
              active === tab.id ? 'border-b-2 border-brand-600 text-brand-700' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-5" role="tabpanel">
        {tabs.find((t) => t.id === active)?.content}
      </div>
    </div>
  );
}
