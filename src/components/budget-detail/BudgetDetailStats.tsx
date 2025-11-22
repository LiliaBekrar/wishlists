// 📄 src/components/budget-detail/BudgetDetailStats.tsx
// 🧠 Stats + donut MASQUÉ PAR DÉFAUT avec message explicite

import { useState } from 'react';
import { BudgetDonut } from '../budget/BudgetDonut';
import { useBudgetDonutData } from '../../hooks/useBudget';
import { formatPrice } from '../../utils/format';
import { FOCUS_RING } from '../../utils/constants';
import type { BudgetType } from '../../types/db';

interface BudgetDetailStatsProps {
  userId: string;
  year: number;
  budgetType: BudgetType;
  totalSpent: number;
  limit: number | null;
  stats: {
    count: number;
    average: number;
    total_shipping: number;
  };
  budgetStatus: 'safe' | 'warning' | 'exceeded';
  onSetLimit: () => void;
  onExportCSV: () => void;
  onAddExternalGift: () => void;
}

export function BudgetDetailStats({
  userId,
  year,
  totalSpent,
  limit,
  stats,
  budgetStatus,
  onSetLimit,
  onExportCSV,
  onAddExternalGift,
}: BudgetDetailStatsProps) {
  const [viewMode, setViewMode] = useState<'global' | 'person' | 'theme' | 'list'>('person');

  // ✅ MASQUÉ PAR DÉFAUT
  const [showDonut, setShowDonut] = useState(() => {
    const saved = localStorage.getItem('budgetDetail_showDonut');
    return saved !== null ? saved === 'true' : false; // ⬅️ Par défaut MASQUÉ
  });

  const { data: donutData, loading: donutLoading } = useBudgetDonutData(userId, viewMode, year);

  const progress = limit && limit > 0 ? Math.round((totalSpent / limit) * 100) : 0;
  const remaining = limit ? Math.max(0, limit - totalSpent) : 0;
  const exceeded = limit ? Math.max(0, totalSpent - limit) : 0;

  const statusConfig = {
    safe: {
      emoji: '🎉',
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-300',
      text: 'text-green-700',
      bar: 'bg-green-500',
      message: limit ? (
        <>
          <strong>Bravo !</strong> Vous êtes dans votre budget. Il vous reste{' '}
          <strong className="text-green-800">{formatPrice(remaining)}</strong> à dépenser.
        </>
      ) : (
        <>Vous avez dépensé <strong>{formatPrice(totalSpent)}</strong>.</>
      ),
    },
    warning: {
      emoji: '⚠️',
      bg: 'from-orange-50 to-yellow-50',
      border: 'border-orange-300',
      text: 'text-orange-700',
      bar: 'bg-orange-500',
      message: (
        <>
          <strong>Attention !</strong> Il ne vous reste que{' '}
          <strong className="text-orange-800">{formatPrice(remaining)}</strong> avant de dépasser votre budget.
        </>
      ),
    },
    exceeded: {
      emoji: '🔴',
      bg: 'from-red-50 to-pink-50',
      border: 'border-red-300',
      text: 'text-red-700',
      bar: 'bg-red-500',
      message: (
        <>
          <strong>Aïe aïe aïe !</strong> Vous avez dépassé votre budget de{' '}
          <strong className="text-red-800">{formatPrice(exceeded)}</strong>.
        </>
      ),
    },
  };

  const colors = statusConfig[budgetStatus];

  const toggleDonut = () => {
    const newValue = !showDonut;
    setShowDonut(newValue);
    localStorage.setItem('budgetDetail_showDonut', newValue.toString());
  };

  return (
    <div className="space-y-6">
      {/* BARRE VERTE : Total + Stats + Actions */}
      <div className={`bg-gradient-to-br ${colors.bg} backdrop-blur-xl rounded-2xl shadow-xl border-2 ${colors.border} p-6`}>
        <div className="space-y-4">
          {/* Message dynamique */}
          <div className={`bg-white/60 rounded-xl p-4 border-2 ${colors.border}`}>
            <p className={`text-sm sm:text-base ${colors.text} font-medium flex items-start gap-2`}>
              <span className="text-2xl flex-shrink-0">{colors.emoji}</span>
              <span>{colors.message}</span>
            </p>
          </div>

          {/* Total + Stats rapides + Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Total dépensé */}
            <div className="bg-white/60 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Total dépensé</p>
              <p className={`text-4xl sm:text-5xl font-bold ${colors.text}`}>{formatPrice(totalSpent)}</p>

              {limit && limit > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-700 font-medium">Limite : {formatPrice(limit)}</span>
                    <span className={`font-bold ${colors.text}`}>{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.bar} transition-all duration-500`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Stats rapides */}
            <div className="bg-white/60 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Statistiques</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Cadeaux</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.count}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Prix moyen</p>
                  <p className="text-2xl font-bold text-blue-600">{formatPrice(stats.average)}</p>
                </div>
                {stats.total_shipping > 0 && (
                  <div className="bg-orange-50 rounded-lg p-3 col-span-2">
                    <p className="text-xs text-gray-600 mb-1">Frais de port</p>
                    <p className="text-2xl font-bold text-orange-600">{formatPrice(stats.total_shipping)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white/60 rounded-xl p-4 flex flex-col justify-center gap-2">
              <button
                onClick={onSetLimit}
                className={`w-full px-4 py-3 bg-white hover:bg-gray-50 text-purple-700 font-semibold rounded-xl border-2 border-purple-300 transition-all shadow-sm hover:shadow-md ${FOCUS_RING}`}
              >
                {limit ? '✏️ Modifier limite' : '🎯 Définir limite'}
              </button>
              <button
                onClick={onExportCSV}
                disabled={stats.count === 0}
                className={`w-full px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-300 transition-all disabled:opacity-50 shadow-sm hover:shadow-md ${FOCUS_RING}`}
              >
                📥 Export CSV
              </button>
              <button
                onClick={onAddExternalGift}
                className={`w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-105 ${FOCUS_RING}`}
              >
                + Cadeau hors app
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DONUT PLEINE LARGEUR (masqué par défaut) */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border-2 border-purple-200/50 overflow-hidden">
        {/* Header avec bouton toggle */}
        <button
          onClick={toggleDonut}
          className={`w-full flex items-center justify-between p-6 border-b-2 border-purple-200/50 transition-all hover:bg-purple-50/50 ${FOCUS_RING}`}
        >
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>📊</span>
            Répartition des dépenses
          </h2>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold ${
            showDonut
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            <span className="text-lg">{showDonut ? '👁️' : '👁️‍🗨️'}</span>
            <span className="hidden sm:inline">{showDonut ? 'Masquer' : 'Afficher'}</span>
            <svg
              className={`w-5 h-5 transition-transform ${showDonut ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Contenu du donut */}
        {showDonut && (
          <div className="p-6">
            {donutLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
              </div>
            ) : donutData.length > 0 ? (
              <BudgetDonut
                data={donutData}
                viewMode={viewMode}
                totalSpent={totalSpent}
                onViewModeChange={setViewMode}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📦</p>
                <p>Aucune donnée pour le moment</p>
              </div>
            )}
          </div>
        )}

        {/* Message quand masqué */}
        {!showDonut && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl">
              <span className="text-3xl">📊</span>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900 mb-1">Graphique masqué</p>
                <p className="text-xs text-gray-600">Cliquez sur "Afficher" pour voir la répartition de vos dépenses</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
