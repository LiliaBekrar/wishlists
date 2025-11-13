/* eslint-disable @typescript-eslint/no-unused-vars */
// 📄 OwnerStats.tsx
// 🧠 Rôle : Stats pour le propriétaire de la liste (sans info sur réservations)
import type { Item } from '../hooks/useItems';

interface OwnerStatsProps {
  items: Item[];
}

export default function OwnerStats({ items }: OwnerStatsProps) {
  const total = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const avgPrice = total > 0 ? totalValue / total : 0;

  const byPriority = {
    haute: items.filter(i => i.priority === 'haute').length,
    moyenne: items.filter(i => i.priority === 'moyenne').length,
    basse: items.filter(i => i.priority === 'basse').length
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total cadeaux */}
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total cadeaux</p>
            <p className="text-xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
      </div>

      {/* Valeur totale */}
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600">Valeur totale</p>
            <p className="text-xl font-bold text-gray-900">{totalValue.toFixed(2)} €</p>
          </div>
        </div>
      </div>

      {/* Prix moyen */}
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600">Prix moyen</p>
            <p className="text-xl font-bold text-gray-900">{avgPrice.toFixed(2)} €</p>
          </div>
        </div>
      </div>
    </div>
  );
}
