// 📄 src/components/budget-detail/BudgetDetailInsights.tsx
// 🧠 Section insights & suggestions

import { formatPrice } from '../../utils/format';

interface BudgetInsights {
  imbalance?: { recipient1: string; amount1: number; recipient2: string; amount2: number };
  budget_status: 'safe' | 'warning' | 'exceeded';
  missing_prices_count: number;
}

interface BudgetDetailStats {
  total_shipping: number;
  biggest_discount: number;
}

interface BudgetDetailInsightsProps {
  insights: BudgetInsights;
  stats: BudgetDetailStats;
}

export function BudgetDetailInsights({ insights, stats }: BudgetDetailInsightsProps) {
  // Ne rien afficher si aucun insight
  const hasInsights =
    insights.imbalance ||
    insights.missing_prices_count > 0 ||
    stats.biggest_discount > 0 ||
    stats.total_shipping > 0;

  if (!hasInsights) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">💡</span>
        Insights & Suggestions
      </h2>

      <ul className="space-y-2 text-sm">
        {insights.imbalance && (
          <li className="flex items-start gap-2">
            <span className="text-orange-500 font-bold flex-shrink-0">⚠️</span>
            <span className="text-gray-700">
              Déséquilibre :{' '}
              <strong>{formatPrice(insights.imbalance.amount1)}</strong> pour{' '}
              <strong>{insights.imbalance.recipient1}</strong> vs{' '}
              <strong>{formatPrice(insights.imbalance.amount2)}</strong> pour{' '}
              <strong>{insights.imbalance.recipient2}</strong>
            </span>
          </li>
        )}

        {insights.missing_prices_count > 0 && (
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold flex-shrink-0">💡</span>
            <span className="text-gray-700">
              <strong>{insights.missing_prices_count}</strong> cadeau
              {insights.missing_prices_count > 1 ? 'x' : ''} sans prix réel renseigné
            </span>
          </li>
        )}

        {stats.total_shipping > 0 && (
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold flex-shrink-0">📦</span>
            <span className="text-gray-700">
              Frais de port totaux : <strong>{formatPrice(stats.total_shipping)}</strong>
            </span>
          </li>
        )}

        {stats.biggest_discount > 0 && (
          <li className="flex items-start gap-2">
            <span className="text-green-500 font-bold flex-shrink-0">💰</span>
            <span className="text-gray-700">
              Plus grosse économie : <strong>{formatPrice(stats.biggest_discount)}</strong> (prix réel vs annoncé)
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
