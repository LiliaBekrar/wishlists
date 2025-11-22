// 📄 src/components/budget-detail/BudgetDetailGiftsAll.tsx
// 🧠 Vue grille de tous les cadeaux

import { formatPrice } from '../../utils/format';
import type { BudgetGift } from '../../hooks/useBudgetDetail';

interface BudgetDetailGiftsAllProps {
  gifts: BudgetGift[];
}

export function BudgetDetailGiftsAll({ gifts }: BudgetDetailGiftsAllProps) {
  if (gifts.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-200/50 p-12 text-center">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-gray-600 text-lg">Aucun cadeau</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {gifts.map((gift) => (
        <div
          key={gift.id}
          className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border-2 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 ${
            gift.source === 'in-app' ? 'border-purple-200/50' : 'border-green-200/50'
          }`}
        >
          {/* Header */}
          <div
            className={`p-3 ${
              gift.source === 'in-app'
                ? 'bg-gradient-to-r from-purple-50 to-blue-50'
                : 'bg-gradient-to-r from-green-50 to-emerald-50'
            } border-b border-gray-200`}
          >
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              {gift.source === 'in-app' ? '🎁 In-app' : '🛍️ Hors app'}
            </span>
          </div>

          {/* Contenu */}
          <div className="p-4">
            <h4 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 min-h-[3rem]">
              {gift.title}
            </h4>

            <div className="flex items-start gap-2 mb-3 p-2 bg-purple-50 rounded-lg">
              <svg
                className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 mb-0.5">Pour</p>
                <p className="text-sm font-bold text-gray-900 truncate">{gift.recipient_name}</p>
              </div>
            </div>

            <div className="flex items-end justify-between pt-3 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500 mb-1">Prix</p>
                <p className="text-2xl font-bold text-purple-600">{formatPrice(gift.total_price)}</p>
              </div>

              <p className="text-xs text-gray-500">
                {new Date(gift.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
