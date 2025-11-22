// 📄 src/components/budget-detail/BudgetDetailRecipients.tsx
// 🧠 Section destinataires avec bouton gérer

import { useNavigate } from 'react-router-dom';
import { FOCUS_RING } from '../../utils/constants';
import { formatPrice } from '../../utils/format';

export interface RecipientGroup {
  recipient_id: string;
  recipient_name: string;
  total_spent: number;
  gift_count: number;
}

interface BudgetDetailRecipientsProps {
  recipientGroups: RecipientGroup[];
  onRecipientClick: () => void;
}

export function BudgetDetailRecipients({ recipientGroups, onRecipientClick }: BudgetDetailRecipientsProps) {
  const navigate = useNavigate();

  if (recipientGroups.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">👥</span>
          Destinataires de ce budget ({recipientGroups.length})
        </h2>
        <button
          onClick={() => navigate('/recipients')}
          className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-105 ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="hidden sm:inline">Gérer</span>
          <span className="sm:hidden">Gérer destinataires</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {recipientGroups.map((group) => (
          <div
            key={group.recipient_id}
            className="bg-white/80 backdrop-blur rounded-xl p-3 border border-indigo-200 hover:border-indigo-400 transition-all hover:scale-105 cursor-pointer"
            onClick={onRecipientClick}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold mb-2">
                {group.recipient_name[0]?.toUpperCase() || '?'}
              </div>
              <p className="font-bold text-gray-900 text-sm truncate w-full">{group.recipient_name}</p>
              <p className="text-xs text-gray-600">
                {group.gift_count} cadeau{group.gift_count > 1 ? 'x' : ''}
              </p>
              <p className="text-sm font-bold text-purple-600 mt-1">{formatPrice(group.total_spent)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
