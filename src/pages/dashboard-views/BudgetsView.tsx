// 📄 src/pages/dashboard-views/BudgetsView.tsx
// 🧠 Rôle : Vue Budgets MOBILE-FIRST (correction responsive)

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useBudget, useBudgetDonutData } from '../../hooks/useBudget';
import { BudgetCard } from '../../components/budget/BudgetCard';
import { BudgetDonut } from '../../components/budget/BudgetDonut';
import { ExternalGiftModal } from '../../components/budget/ExternalGiftModal';
import { FOCUS_RING } from '../../utils/constants';
import { formatPrice } from '../../utils/format';
import type { BudgetViewMode } from '../../types/db';

export default function BudgetsView() {
  const { user } = useAuth();
  const { budgets, loading, error } = useBudget(user?.id || '');

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(2025);
  const [viewMode, setViewMode] = useState<BudgetViewMode>('theme');
  const [showExternalGiftModal, setShowExternalGiftModal] = useState(false);

  const { data: donutData, loading: donutLoading } = useBudgetDonutData(
    user?.id || '',
    viewMode,
    selectedYear
  );

  const totalSpent = budgets.find(b =>
    b.budgetGoal.type === 'annuel' && b.budgetGoal.year === selectedYear
  )?.spent || 0;

  const activeBudgets = budgets.filter(b => b.spent > 0);
  const avgPerBudget = activeBudgets.length > 0 ? totalSpent / activeBudgets.length : 0;
  const topBudget = [...budgets].sort((a, b) => b.spent - a.spent)[0];

  if (!user) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-yellow-800 text-lg font-semibold">
          Connectez-vous pour accéder à vos budgets
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de vos budgets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
        <p className="font-semibold text-xl mb-4 text-red-800">❌ Erreur</p>
        <p className="text-red-700 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className={`w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all ${FOCUS_RING}`}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ Header */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-900">
                💰 Mes budgets
              </h2>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={`px-4 py-2 border-2 border-purple-300 rounded-xl font-bold text-lg text-purple-700 bg-white/80 backdrop-blur ${FOCUS_RING} hover:border-purple-500 transition-all hover:scale-105 cursor-pointer w-fit`}
              >
                {Array.from({ length: currentYear - 2024 }, (_, i) => 2025 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {budgets.length > 0 ? (
              <p className="text-gray-700 text-base sm:text-lg">
                Vous avez dépensé{' '}
                <span className="font-bold text-purple-700">
                  {formatPrice(totalSpent)}
                </span>
                {' '}sur{' '}
                <span className="font-bold text-purple-700">
                  {budgets.length} budget{budgets.length > 1 ? 's' : ''}
                </span>
              </p>
            ) : (
              <p className="text-gray-600">
                Aucune dépense enregistrée pour {selectedYear}
              </p>
            )}
          </div>

          <button
            onClick={() => setShowExternalGiftModal(true)}
            className={`
              inline-flex items-center justify-center gap-2
              px-6 py-3
              bg-gradient-to-r from-purple-600 to-blue-600
              hover:from-purple-700 hover:to-blue-700
              text-white font-semibold
              rounded-xl shadow-lg hover:shadow-xl
              transition-all hover:scale-105
              whitespace-nowrap
              w-full sm:w-auto
              ${FOCUS_RING}
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Ajouter un cadeau hors app</span>
          </button>
        </div>
      </div>

      {budgets.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-12 sm:p-16 text-center">
          <div className="text-6xl sm:text-8xl mb-6">🎁</div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            Aucun budget pour {selectedYear}
          </h3>
          <p className="text-gray-600 text-base sm:text-lg mb-6 max-w-md mx-auto">
            Réservez des cadeaux dans l'app ou ajoutez des cadeaux achetés ailleurs pour voir vos budgets apparaître !
          </p>
          <button
            onClick={() => setShowExternalGiftModal(true)}
            className={`
              inline-flex items-center gap-2
              px-6 sm:px-8 py-3 sm:py-4
              bg-gradient-to-r from-purple-600 to-blue-600
              hover:from-purple-700 hover:to-blue-700
              text-white font-bold text-base sm:text-lg
              rounded-xl shadow-lg hover:shadow-xl
              transition-all hover:scale-105
              ${FOCUS_RING}
            `}
          >
            <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter mon premier cadeau
          </button>
        </div>
      ) : (
        <>
          {/* ✅ MOBILE : Ordre logique Stats → Budgets → Donut */}
          <div className="block xl:hidden space-y-6">
            {/* Stats */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📊 Statistiques rapides
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-purple-200/50 p-5">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">Total dépensé</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {formatPrice(totalSpent)}
                    </p>
                  </div>
                </div>

                {activeBudgets.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-purple-200/50 p-5">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Moyenne par budget</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatPrice(avgPerBudget)}
                      </p>
                    </div>
                  </div>
                )}

                {topBudget && topBudget.spent > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-purple-200/50 p-5">
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                      <p className="text-sm text-gray-600 mb-1">🏆 Budget le plus élevé</p>
                      <p className="font-bold text-gray-900 text-base mb-1 truncate">
                        {topBudget.budgetGoal.name || 'Budget annuel'}
                      </p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatPrice(topBudget.spent)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-purple-200/50 p-5">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Budgets actifs</p>
                    <p className="text-3xl font-bold text-green-600">
                      {activeBudgets.length} <span className="text-xl text-gray-500">/ {budgets.length}</span>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Budgets */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📋 Vos budgets
              </h3>
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-purple-200/50 p-5">
                <div className="space-y-3">
                  {budgets.map(budgetData => (
                    <BudgetCard
                      key={budgetData.budgetGoal.id}
                      budgetData={budgetData}
                      onEditLimit={() => alert('Modal modifier limite à implémenter')}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Donut (UNE SEULE FOIS) */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📈 Répartition des dépenses
              </h3>

              {donutLoading ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center border border-purple-200/50">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mb-4"></div>
                  <p className="text-gray-600 font-medium">Chargement du graphique...</p>
                </div>
              ) : donutData.length > 0 ? (
                <BudgetDonut
                  data={donutData}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  totalSpent={totalSpent}
                />
              ) : (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center border border-purple-200/50">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-gray-600 text-lg">
                    Graphique disponible dès que vous aurez des cadeaux réservés
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* ✅ DESKTOP : Layout 2/3 + 1/3 */}
          <div className="hidden xl:grid xl:grid-cols-3 gap-6">
            {/* Donut (2/3) */}
            <div className="xl:col-span-2">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📈 Répartition des dépenses
              </h3>

              {donutLoading ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center border border-purple-200/50 min-h-[500px] flex items-center justify-center">
                  <div>
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Chargement du graphique...</p>
                  </div>
                </div>
              ) : donutData.length > 0 ? (
                <BudgetDonut
                  data={donutData}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  totalSpent={totalSpent}
                />
              ) : (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center border border-purple-200/50 min-h-[500px] flex items-center justify-center">
                  <div>
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-600 text-lg">
                      Graphique disponible dès que vous aurez des cadeaux réservés
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats + Budgets (1/3) */}
            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  📊 Statistiques
                </h3>
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-purple-200/50 p-5 space-y-4">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">Total dépensé</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {formatPrice(totalSpent)}
                    </p>
                  </div>

                  {activeBudgets.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Moyenne par budget</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatPrice(avgPerBudget)}
                      </p>
                    </div>
                  )}

                  {topBudget && topBudget.spent > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                      <p className="text-sm text-gray-600 mb-1">🏆 Budget le plus élevé</p>
                      <p className="font-bold text-gray-900 text-base mb-1 truncate">
                        {topBudget.budgetGoal.name || 'Budget annuel'}
                      </p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatPrice(topBudget.spent)}
                      </p>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Budgets actifs</p>
                    <p className="text-2xl font-bold text-green-600">
                      {activeBudgets.length} / {budgets.length}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  📋 Vos budgets
                </h3>
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-purple-200/50 p-5 space-y-3 max-h-[600px] overflow-y-auto">
                  {budgets.map(budgetData => (
                    <BudgetCard
                      key={budgetData.budgetGoal.id}
                      budgetData={budgetData}
                      onEditLimit={() => alert('Modal modifier limite à implémenter')}
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      <ExternalGiftModal
        isOpen={showExternalGiftModal}
        onClose={() => setShowExternalGiftModal(false)}
        userId={user?.id || ''}
        onSuccess={() => {
          setShowExternalGiftModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
