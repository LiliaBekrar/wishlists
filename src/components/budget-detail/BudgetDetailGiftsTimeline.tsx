// 📄 src/components/budget-detail/BudgetDetailGiftsTimeline.tsx
// 🧠 Vue timeline des cadeaux

import { useNavigate } from 'react-router-dom';
import { FOCUS_RING } from '../../utils/constants';
import { formatPrice } from '../../utils/format';
import type { BudgetGift } from '../../hooks/useBudgetDetail';

interface BudgetDetailGiftsTimelineProps {
  gifts: BudgetGift[];
}

export function BudgetDetailGiftsTimeline({ gifts }: BudgetDetailGiftsTimelineProps) {
  const navigate = useNavigate();

  if (gifts.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-200/50 p-12 text-center">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-gray-600 text-lg">Aucun cadeau</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {gifts.map((gift, index) => {
        const prevDate =
          index > 0 ? new Date(gifts[index - 1].date).toLocaleDateString('fr-FR') : null;
        const currentDate = new Date(gift.date).toLocaleDateString('fr-FR');
        const showDateSeparator = prevDate !== currentDate;

        return (
          <div key={gift.id}>
            {showDateSeparator && (
              <div className="flex items-center gap-3 my-4">
                <div className="h-px flex-1 bg-purple-300" />
                <p className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                  {new Date(gift.date).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
                <div className="h-px flex-1 bg-purple-300" />
              </div>
            )}

            <div
              className={`border-2 rounded-xl p-3 sm:p-4 bg-white/80 backdrop-blur ${
                gift.source === 'in-app' ? 'border-purple-200' : 'border-green-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {gift.source === 'in-app' ? '🎁' : '🛍️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                      {gift.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Pour : <span className="font-medium">{gift.recipient_name}</span>
                    </p>
                    {gift.source === 'in-app' && gift.wishlist_name && (
                      <p className="text-xs text-gray-500 truncate">Liste : {gift.wishlist_name}</p>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">
                    {formatPrice(gift.total_price)}
                  </p>
                  {gift.source === 'in-app' && gift.wishlist_slug && (
                    <button
                      onClick={() => navigate(`/list/${gift.wishlist_slug}`)}
                      className={`mt-2 px-3 py-1.5 text-xs sm:text-sm font-medium bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all ${FOCUS_RING}`}
                    >
                      Voir →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
