/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/components/budget-detail/BudgetDetailGiftsByRecipient.tsx
// 🧠 Vue par destinataire avec GRID cadeaux + modification prix réel

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FOCUS_RING } from '../../utils/constants';
import { formatPrice } from '../../utils/format';
import type { BudgetGift, RecipientGroup } from '../../hooks/useBudgetDetail';

interface BudgetDetailGiftsByRecipientProps {
  recipientGroups: RecipientGroup[];
  editingPaidAmount: { [key: string]: string };
  onEditPaidAmount: (claimId: string, value: string) => void;
  onSavePaidAmount: (claimId: string) => Promise<void>;
  onEditExternalGift: (gift: any) => void;
  onDeleteExternalGift: (giftId: string) => Promise<void>;
  onCancelClaim: (claimId: string) => Promise<void>;
}

export function BudgetDetailGiftsByRecipient({
  recipientGroups,
  editingPaidAmount,
  onEditPaidAmount,
  onSavePaidAmount,
  onEditExternalGift,
  onDeleteExternalGift,
  onCancelClaim,
}: BudgetDetailGiftsByRecipientProps) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);

  const handleDelete = async (gift: BudgetGift) => {
    if (gift.source === 'external') {
      if (!confirm('Supprimer ce cadeau hors app ?')) return;
      try {
        setDeletingId(gift.id);
        await onDeleteExternalGift(gift.id);
      } finally {
        setDeletingId(null);
      }
    } else {
      if (!confirm('Annuler cette réservation ?')) return;
      try {
        setDeletingId(gift.id);
        await onCancelClaim(gift.claim_id!);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (recipientGroups.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-200/50 p-12 text-center">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-gray-600 text-lg">Aucun cadeau dans ce budget</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {recipientGroups.map((group) => (
        <div
          key={group.recipient_id}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border-2 border-purple-200/50 overflow-hidden"
        >
          {/* Header destinataire */}
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 sm:px-6 py-4 border-b-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0">
                  {group.recipient_name[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">{group.recipient_name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {group.gift_count} cadeau{group.gift_count > 1 ? 'x' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total</p>
                <p className="text-xl sm:text-3xl font-bold text-purple-600">{formatPrice(group.total_spent)}</p>
              </div>
            </div>
          </div>

          {/* GRID des cadeaux (3-4 colonnes sur desktop) */}
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.gifts.map((gift) => (
              <div
                key={gift.id}
                className={`border-2 rounded-xl p-4 flex flex-col ${
                  gift.source === 'in-app' ? 'border-purple-200 bg-purple-50/50' : 'border-green-200 bg-green-50/50'
                }`}
              >
                {/* Header cadeau */}
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-2xl flex-shrink-0">{gift.source === 'in-app' ? '🎁' : '🛍️'}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-lg line-clamp-2 mb-1">{gift.title}</h4>
                    {gift.source === 'in-app' && gift.wishlist_name && (
                      <p className="text-md text-gray-600 truncate">📋 {gift.wishlist_name}</p>
                    )}
                    <p className="text-md text-gray-500">
                      📅 {new Date(gift.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>

                {/* Prix */}
                <div className="mb-3">
                  <p className="text-md text-yellow-700 mb-2">
                    Annoncé : <strong>{formatPrice(gift.announced_price)}</strong>
                          {gift.shipping_cost > 0 && ` + ${formatPrice(gift.shipping_cost)}`}
                  </p>
                </div>

                {/* Prix réel (in-app uniquement) */}
                {gift.source === 'in-app' && (
                  <>
                    {gift.paid_amount === null || gift.paid_amount === undefined || editingPriceId === gift.claim_id ? (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2 mb-3">
                        <p className="text-xs font-semibold text-yellow-800 mb-2 flex items-center gap-1">
                          <span>⚠️</span>
                          {editingPriceId === gift.claim_id ? 'Modifier prix réel' : 'Prix réel non renseigné'}
                        </p>
                        <p className="text-xs text-yellow-700 mb-2">
                          Annoncé : <strong>{formatPrice(gift.announced_price)}</strong>
                          {gift.shipping_cost > 0 && ` + ${formatPrice(gift.shipping_cost)}`}
                        </p>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Prix réel"
                            value={editingPaidAmount[gift.claim_id!] || ''}
                            onChange={(e) => onEditPaidAmount(gift.claim_id!, e.target.value)}
                            className={`flex-1 px-2 py-1.5 border border-yellow-300 rounded text-xs ${FOCUS_RING}`}
                          />
                          <button
                            onClick={async () => {
                              await onSavePaidAmount(gift.claim_id!);
                              setEditingPriceId(null);
                            }}
                            disabled={!editingPaidAmount[gift.claim_id!]}
                            className={`px-2 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-semibold rounded text-xs transition-all ${FOCUS_RING}`}
                          >
                            ✅
                          </button>
                          {editingPriceId === gift.claim_id && (
                            <button
                              onClick={() => {
                                setEditingPriceId(null);
                                onEditPaidAmount(gift.claim_id!, '');
                              }}
                              className={`px-2 py-1.5 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded text-xs transition-all ${FOCUS_RING}`}
                            >
                              ❌
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-300 rounded-lg p-2 mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-green-800 flex items-center gap-1">
                            <span>✅</span>
                            Prix réel
                          </p>
                          <button
                            onClick={() => {
                              setEditingPriceId(gift.claim_id!);
                              onEditPaidAmount(gift.claim_id!, gift.paid_amount!.toString());
                            }}
                            className={`p-1 hover:bg-green-200 rounded transition-all ${FOCUS_RING}`}
                            title="Modifier le prix réel"
                          >
                            <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-green-700">
                          <strong>{formatPrice(gift.paid_amount)}</strong>
                        </p>
                        {gift.paid_amount < gift.announced_price + gift.shipping_cost && (
                          <p className="text-xs text-green-600 mt-1">
                            💰 Vous avez économisé {formatPrice(gift.announced_price + gift.shipping_cost - gift.paid_amount)}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-auto">
                  {gift.source === 'in-app' && gift.wishlist_slug && (
                    <button
                      onClick={() => navigate(`/list/${gift.wishlist_slug}`)}
                      className={`w-full px-3 py-2 text-xs font-medium bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all ${FOCUS_RING}`}
                    >
                      Voir la liste →
                    </button>
                  )}

                  {gift.source === 'external' && (
                    <button
                      onClick={() => onEditExternalGift(gift.external_gift_data)}
                      className={`w-full px-3 py-2 text-xs font-medium bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-all ${FOCUS_RING}`}
                    >
                      ✏️ Modifier
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(gift)}
                    disabled={deletingId === gift.id}
                    className={`w-full px-3 py-2 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all disabled:opacity-50 ${FOCUS_RING}`}
                  >
                    {deletingId === gift.id ? '⏳ Suppression...' : '🗑️ Supprimer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
