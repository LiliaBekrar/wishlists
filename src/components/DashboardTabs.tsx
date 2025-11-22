// 📄 src/components/DashboardTabs.tsx
// 🧠 Rôle : Navigation Dashboard avec select mobile + tabs desktop

import { FOCUS_RING } from '../utils/constants';

export type DashboardTab = 'my-lists' | 'member-lists' | 'my-claims' | 'budgets';

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  counts: {
    myLists: number;
    memberLists: number;
    myClaims: number;
    activeBudgets: number;
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
      count: counts.activeBudgets || 0,
      disabled: false,
    },
  ];

  return (
    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm mb-8">

      {/* 📱 Mobile : Select */}
      <div className="md:hidden px-4 py-4">
        <div className="relative">
          <select
            value={activeTab}
            onChange={(e) => onTabChange(e.target.value as DashboardTab)}
            className={`
              w-full appearance-none
              px-5 py-4 pr-12
              bg-gradient-to-r from-purple-600 to-blue-600
              text-white font-bold text-base
              rounded-xl border-2 border-purple-700
              shadow-lg cursor-pointer
              ${FOCUS_RING}
            `}
          >
            {tabs.map((tab) => (
              <option
                key={tab.id}
                value={tab.id}
                disabled={tab.disabled}
                className="bg-white text-gray-900 font-semibold"
              >
                {`${tab.icon} ${tab.label}${
                  tab.count > 0 ? ` (${tab.count})` : ''
                }`}
              </option>
            ))}
          </select>

          {/* Chevron */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 💻 Desktop : Tabs */}
      <div className="hidden md:block">
        <div className="inline-flex items-center gap-6 px-6 py-4 overflow-x-auto scrollbar-hide bg-gray-50/70 border-b border-gray-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && onTabChange(tab.id)}
                disabled={tab.disabled}
                className={`
                  group flex items-center gap-2
                  px-5 py-3 rounded-lg font-semibold whitespace-nowrap
                  transition-all duration-200 border
                  ${FOCUS_RING}

                  ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-700 shadow-md scale-[1.03]'
                      : tab.disabled
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                  }
                `}
              >
                <span
                  className={`text-lg icon-bounce ${
                    isActive ? 'icon-bounce-active' : ''
                  }`}
                >
                  {tab.icon}
                </span>

                <span>{tab.label}</span>

                {tab.count > 0 && (
                  <span
                    className={`
                      px-2 py-0.5 rounded-full text-xs font-bold
                      ${
                        isActive
                          ? 'bg-white/90 text-purple-700'
                          : 'bg-white text-purple-700 border border-purple-200'
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
