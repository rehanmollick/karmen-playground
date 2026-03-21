'use client';

export type TabId = 'schedule' | 'change-orders' | 'risk';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'schedule', label: 'Schedule Builder' },
  { id: 'change-orders', label: 'Change Orders' },
  { id: 'risk', label: 'Risk Analysis' },
];

interface TabNavProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export default function TabNav({ activeTab, onChange }: TabNavProps) {
  return (
    <div className="bg-white border-b border-[var(--border-default)] px-6">
      <div className="flex gap-0">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                px-5 py-3.5 text-sm font-medium border-b-2 transition-all
                ${isActive
                  ? 'border-[var(--blue-primary)] text-[var(--blue-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
