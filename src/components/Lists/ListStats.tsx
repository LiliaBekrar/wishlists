// 📄 ListStats.tsx
// 🧠 Rôle : Stats d'une wishlist (total, disponibles, réservés)
import type { Item } from '../../hooks/useItems';

interface ListStatsProps {
  items: Item[];
}

export default function ListStats({ items }: ListStatsProps) {
  const total = items.length;
  const disponibles = items.filter(item => item.status === 'disponible').length;
  const reserves = items.filter(item => item.status === 'réservé').length;

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

      {/* Disponibles */}
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600">Disponibles</p>
            <p className="text-xl font-bold text-gray-900">{disponibles}</p>
          </div>
        </div>
      </div>

      {/* Réservés */}
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600">Réservés</p>
            <p className="text-xl font-bold text-gray-900">{reserves}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
