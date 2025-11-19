/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/components/budget/BudgetDonut.tsx
// 🧠 Rôle : Donut chart interactif avec tooltip toggle (click)


import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { BudgetViewMode } from '../../types/db';
import { formatPrice } from '../../utils/format';
import { THEME_LABELS, FOCUS_RING } from '../../utils/constants';

// ✅ Type compatible Recharts
interface DonutDataItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
  items?: Array<{ title: string; price: number }>;
  [key: string]: any;
}

interface BudgetDonutProps {
  data: DonutDataItem[];
  viewMode: BudgetViewMode;
  onViewModeChange: (mode: BudgetViewMode) => void;
  totalSpent: number;
}

// ✅ Labels normaux (toujours visibles)
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, name, percentage, value, fill } = props;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 50;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const textAnchor = x > cx ? 'start' : 'end';

  return (
    <g>
      <path
        d={`M${cx + (outerRadius + 10) * Math.cos(-midAngle * RADIAN)},${cy + (outerRadius + 10) * Math.sin(-midAngle * RADIAN)}L${x},${y}`}
        stroke={fill}
        strokeWidth={2}
        fill="none"
      />
      <text
        x={x}
        y={y - 8}
        textAnchor={textAnchor}
        fill="#374151"
        fontSize="13"
        fontWeight="600"
      >
        {name}
      </text>
      <text
        x={x}
        y={y + 8}
        textAnchor={textAnchor}
        fill={fill}
        fontSize="15"
        fontWeight="700"
      >
        {formatPrice(value)}
      </text>
      <text
        x={x}
        y={y + 24}
        textAnchor={textAnchor}
        fill="#6B7280"
        fontSize="11"
      >
        ({percentage}%)
      </text>
    </g>
  );
};

export function BudgetDonut({ data, viewMode, onViewModeChange, totalSpent }: BudgetDonutProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipItem, setTooltipItem] = useState<DonutDataItem | null>(null);

  const tabs: { value: BudgetViewMode; label: string; icon: string }[] = [
    { value: 'global', label: 'Vue globale', icon: '📊' },
    { value: 'person', label: 'Par personne', icon: '👤' },
    { value: 'theme', label: 'Par thème', icon: '🎨' },
    { value: 'list', label: 'Par liste', icon: '📋' }
  ];

  // ✅ Ouvrir/fermer le tooltip
  const toggleTooltip = (item: DonutDataItem) => {
    if (tooltipOpen && tooltipItem?.name === item.name) {
      setTooltipOpen(false);
      setTooltipItem(null);
    } else {
      setTooltipOpen(true);
      setTooltipItem(item);
    }
  };

  // ✅ Tooltip détaillé (modal style)
  const DetailedTooltip = () => {
    if (!tooltipOpen || !tooltipItem) return null;

    return (
      <>
        {/* Backdrop pour fermer */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => {
            setTooltipOpen(false);
            setTooltipItem(null);
            setHoveredIndex(null);
          }}
        />

        {/* Tooltip modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border-2 border-purple-300 max-w-md w-full max-h-[80vh] overflow-hidden animate-scale-in">
            {/* Header */}
            <div
              className="p-4 border-b-2 border-gray-200"
              style={{ backgroundColor: `${tooltipItem.color}15` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full ring-4 ring-white shadow-lg"
                    style={{ backgroundColor: tooltipItem.color }}
                  />
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {tooltipItem.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {tooltipItem.items?.length || 0} cadeau{(tooltipItem.items?.length || 0) > 1 ? 'x' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTooltipOpen(false);
                    setTooltipItem(null);
                    setHoveredIndex(null);
                  }}
                  className={`w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-all ${FOCUS_RING}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Liste des cadeaux (scrollable) */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-180px)]">
              {tooltipItem.items && tooltipItem.items.length > 0 ? (
                <div className="space-y-3">
                  {tooltipItem.items.map((gift, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium leading-tight">{gift.title}</p>
                      </div>
                      <span
                        className="font-bold text-lg whitespace-nowrap"
                        style={{ color: tooltipItem.color }}
                      >
                        {formatPrice(gift.price)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 italic">Aucun détail disponible</p>
                </div>
              )}
            </div>

            {/* Footer avec total */}
            <div
              className="p-4 border-t-2 border-gray-200"
              style={{ backgroundColor: `${tooltipItem.color}10` }}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-lg">Total</span>
                <span
                  className="font-bold text-2xl"
                  style={{ color: tooltipItem.color }}
                >
                  {formatPrice(tooltipItem.value)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 text-center">
                {tooltipItem.percentage}% du budget total
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  // ✅ Export CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Nom', 'Montant', 'Pourcentage'],
      ...data.map(item => [
        viewMode === 'theme' && THEME_LABELS[item.name] ? THEME_LABELS[item.name] : item.name,
        item.value.toFixed(2),
        item.percentage
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `budget-${viewMode}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-200/50 overflow-hidden">
      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg border-b border-gray-200">
        <div className="flex gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide px-6 py-5">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => onViewModeChange(tab.value)}
              className={`
                group flex items-center gap-3 px-6 py-3.5 rounded-xl font-semibold whitespace-nowrap transition-all duration-300
                ${FOCUS_RING}
                ${viewMode === tab.value
                  ? 'bg-purple-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-sm sm:text-base">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Total dépensé */}
        <div className="text-center mb-8 p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl border-2 border-purple-200/50">
          <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total dépensé</p>
          <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            {formatPrice(totalSpent)}
          </p>
        </div>

        {/* Donut Chart */}
        {data.length > 0 ? (
          <>
            {/* Desktop : Labels autour */}
            <div className="hidden lg:block relative">
              <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                  <Pie
                    data={data as any[]}
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={140}
                    paddingAngle={0}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={(_, index) => {
                      setHoveredIndex(index);
                      toggleTooltip(data[index]);
                    }}
                    label={renderCustomizedLabel}
                    labelLine={false}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                        className="transition-all cursor-pointer"
                        style={{
                          filter: hoveredIndex === index
                            ? `drop-shadow(0 0 12px ${entry.color}) brightness(1.1)`
                            : 'none',
                          opacity: hoveredIndex === index ? 1 : 0.95
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Mobile/Tablet : Donut avec labels */}
            <div className="lg:hidden relative">
              <ResponsiveContainer width="100%" height={450}>
                <PieChart>
                  <Pie
                    data={data as any[]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={0}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                    onClick={(_, index) => {
                      setHoveredIndex(index);
                      toggleTooltip(data[index]);
                    }}
                    label={renderCustomizedLabel}
                    labelLine={false}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                        className="transition-all cursor-pointer"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* ✅ Légende interactive avec cartes */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((item, index) => {
                const displayName = viewMode === 'theme' && THEME_LABELS[item.name]
                  ? THEME_LABELS[item.name]
                  : item.name;

                const isActive = hoveredIndex === index;

                return (
                  <button
                    key={index}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => {
                      setHoveredIndex(index);
                      toggleTooltip(item);
                    }}
                    className={`
                      group relative
                      bg-gradient-to-br from-white to-purple-50/30 backdrop-blur
                      rounded-xl p-4
                      border-2
                      transition-all duration-300
                      text-left
                      ${FOCUS_RING}
                      ${isActive
                        ? 'border-purple-500 shadow-2xl scale-105 -translate-y-1'
                        : 'border-purple-200/50 hover:border-purple-400 hover:shadow-xl hover:-translate-y-1'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          rounded-full flex-shrink-0
                          ring-4 ring-white shadow-lg
                          transition-all duration-300
                          ${isActive ? 'w-6 h-6' : 'w-5 h-5'}
                        `}
                        style={{ backgroundColor: item.color }}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm mb-1">
                          {displayName}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p
                            className={`font-bold transition-all ${isActive ? 'text-xl' : 'text-lg'}`}
                            style={{ color: item.color }}
                          >
                            {formatPrice(item.value)}
                          </p>
                          <p className="text-gray-500 text-sm">
                            ({item.percentage}%)
                          </p>
                        </div>
                      </div>

                      {/* Icône "voir détails" */}
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bouton Export CSV */}
            <div className="mt-8 text-center">
              <button
                onClick={handleExportCSV}
                className={`
                  inline-flex items-center gap-2
                  px-6 py-3
                  bg-gradient-to-r from-purple-600 to-blue-600
                  hover:from-purple-700 hover:to-blue-700
                  text-white font-semibold
                  rounded-xl shadow-lg hover:shadow-xl
                  transition-all hover:scale-105
                  ${FOCUS_RING}
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporter en CSV
              </button>
            </div>
          </>
        ) : (
          /* État vide */
          <div className="text-center py-16 px-4">
            <div className="inline-block p-6 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-full mb-6">
              <span className="text-6xl">📭</span>
            </div>
            <p className="text-xl font-semibold text-gray-800 mb-2">Aucune donnée pour cette vue</p>
            <p className="text-gray-600 max-w-md mx-auto">
              {viewMode === 'list' && 'Réservez des cadeaux dans des listes pour voir la répartition par liste'}
              {viewMode === 'person' && 'Réservez des cadeaux pour voir la répartition par personne'}
              {viewMode === 'theme' && 'Réservez des cadeaux pour voir la répartition par thème'}
              {viewMode === 'global' && 'Réservez des cadeaux pour voir votre budget global'}
            </p>
          </div>
        )}
      </div>

      {/* ✅ Tooltip modal détaillé */}
      <DetailedTooltip />
    </div>
  );
}
