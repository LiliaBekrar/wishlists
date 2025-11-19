// 📄 src/components/budget/BudgetTable.tsx
// 🧠 Rôle : Tableau détaillé des dépenses (liste des cadeaux)

import React from 'react';
import type { Claim, ExternalGift } from '../../types/db';
import { formatPrice, formatDate } from '../../utils/format';
import { THEME_LABELS } from '../../utils/constants';

interface BudgetTableProps {
  claims: Claim[];
  externalGifts: ExternalGift[];
}

export function BudgetTable({ claims, externalGifts }: BudgetTableProps) {
  // Fusionner les deux sources en un tableau unifié
  const allGifts = [
    ...claims.map(claim => ({
      id: claim.id,
      title: claim.items?.title || 'N/A',
      recipient: claim.items?.wishlists?.profiles?.display_name || 'N/A',
      amount: claim.paid_amount || claim.items?.price || 0,
      date: claim.reserved_at || claim.created_at,
      type: 'in-app' as const,
      status: claim.status,
      theme: claim.items?.wishlists?.theme || 'autre'
    })),
    ...externalGifts.map(gift => ({
      id: gift.id,
      title: gift.description || 'Cadeau hors-app',
      recipient: gift.external_recipients?.profiles?.display_name || gift.external_recipients?.name || 'N/A',
      amount: gift.paid_amount,
      date: gift.purchase_date,
      type: 'hors-app' as const,
      status: 'acheté' as const,
      theme: gift.theme
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (allGifts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-gray-500 text-lg">📭 Aucun cadeau à afficher</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          📋 Détail des dépenses ({allGifts.length} cadeau{allGifts.length > 1 ? 'x' : ''})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cadeau
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destinataire
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thème
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allGifts.map(gift => (
              <tr key={gift.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{gift.title}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{gift.recipient}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    {THEME_LABELS[gift.theme] || gift.theme}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900">{formatPrice(gift.amount)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDate(gift.date)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`
                    px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${gift.status === 'réservé' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}
                  `}>
                    {gift.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`
                    px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${gift.type === 'in-app' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}
                  `}>
                    {gift.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Total</span>
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(allGifts.reduce((sum, g) => sum + g.amount, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
