// 📄 src/components/DashboardTabs.tsx
// 🧠 Rôle : Navigation horizontale scrollable mobile-first pour Dashboard

import { FOCUS_RING } from '../utils/constants';

export type DashboardTab = 'my-lists' | 'member-lists' | 'my-claims' | 'budgets';

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  counts: {
    myLists: number;
    memberLists: number;
    myClaims: number;
  };
}

export default function DashboardTabs({
  activeTab,
  onTabChange,
  counts,
}: DashboardTabsProps) {
  const tabs = [
    {
      id: 'my-lists' as DashboardTab,
      label: 'Mes listes',
      icon: '📝',
      count: counts.myLists,
    },
    {
      id: 'member-lists' as DashboardTab,
      label: 'Partagées avec moi',
      icon: '🎁',
      count: counts.memberLists,
    },
    {
      id: 'my-claims' as DashboardTab,
      label: 'Mes réservations',
      icon: '🎯',
      count: counts.myClaims,
    },
    {
      id: 'budgets' as DashboardTab,
      label: 'Budgets',
      icon: '💰',
      count: 0,
      disabled: true,
    },
  ];

  return (
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm mb-8">
      {/* ⬅️ Plus d'espace : px-6 py-5 au lieu de px-4 py-3 */}
      <div className="flex gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide px-6 py-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
              group flex items-center gap-3 px-6 py-3.5 rounded-xl font-semibold whitespace-nowrap transition-all duration-300
              ${FOCUS_RING}
              ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg scale-105'
                  : tab.disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {/* ⬅️ Icône avec animation (classe réutilisable) */}
            <span className={`text-xl icon-bounce ${activeTab === tab.id ? 'icon-bounce-active' : ''}`}>
              {tab.icon}
            </span>
            <span className="text-sm sm:text-base">{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`
                  px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-300
                  ${
                    activeTab === tab.id
                      ? 'bg-white text-purple-600'
                      : 'bg-purple-100 text-purple-700'
                  }
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
