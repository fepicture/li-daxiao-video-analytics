'use client';

import type { MetricKey } from '@/lib/types';

interface Props {
  current: MetricKey;
  options: [MetricKey, string][];
  onChange: (key: MetricKey) => void;
}

export default function MetricSwitcher({ current, options, onChange }: Props) {
  return (
    <div className="flex gap-1 p-1 bg-slate-800 rounded-lg overflow-x-auto">
      {options.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`
            flex-1 min-w-0 px-3 py-2 rounded-md text-xs font-medium
            transition-colors whitespace-nowrap
            ${current === key
              ? 'bg-slate-600 text-white'
              : 'text-slate-400 active:bg-slate-700'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
