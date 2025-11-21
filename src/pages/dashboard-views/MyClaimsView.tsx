// 📄 src/pages/dashboard-views/MyClaimsView.tsx
// 🧠 Vue "Mes réservations" + section "Cadeaux hors app"

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FOCUS_RING } from '../../utils/constants';
import { formatPrice } from '../../utils/format';
import Toast from '../../components/Toast';
import ItemCard from '../../components/Items/ItemCard';
import type { Item } from '../../hooks/useItems';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface MyClaim {
  id: string;
  items: Item & {
    wishlist_id: string | null;
    original_wishlist_name: string | null;
    original_owner_id: string | null;
    wishlists?: {
      id: string;
      name: string;
      slug: string | null;
    };
  };
  wishlist?: {
    id: string;
    name: string;
    slug: string | null;
    profiles: {
      username: string;
    };
  };
}

interface ExternalGift {
  id: string;
  description: string;
  paid_amount: number;
  purchase_date: string;
  theme: string | null;
  recipient_name: string | null;
}

interface MyClaimsViewProps {
  claims: MyClaim[];
  onRefresh: () => void;
}

export default function MyClaimsView({ claims, onRefresh }: MyClaimsViewProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loadingListId, setLoadingListId] = useState<string | null>(null);

  // ✅ État pour les cadeaux hors app
  const [externalGifts, setExternalGifts] = useState<ExternalGift[]>([]);
  const [loadingExternal, setLoadingExternal] = useState(true);
  const [deletingGiftId, setDeletingGiftId] = useState<string | null>(null);

  // ✅ Charger les cadeaux hors app
  useEffect(() => {
    if (!user?.id) return;

    async function fetchExternalGifts() {
      try {
        setLoadingExternal(true);
        const { data, error } = await supabase
          .from('external_gifts')
          .select('*')
          .eq('user_id', user?.id)
          .order('purchase_date', { ascending: false });

        if (error) throw error;
        setExternalGifts(data || []);
      } catch (err) {
        console.error('❌ Erreur fetch external_gifts:', err);
      } finally {
        setLoadingExternal(false);
      }
    }

    fetchExternalGifts();
  }, [user?.id]);

  // ✅ Supprimer un cadeau hors app
  const handleDeleteExternalGift = async (giftId: string) => {
    if (!confirm('Supprimer ce cadeau hors app ?')) return;

    try {
      setDeletingGiftId(giftId);
      const { error } = await supabase
        .from('external_gifts')
        .delete()
        .eq('id', giftId);

      if (error) throw error;

      setExternalGifts(prev => prev.filter(g => g.id !== giftId));
      setToast({ message: 'Cadeau supprimé', type: 'success' });
    } catch (err) {
      console.error('❌ Erreur suppression external_gift:', err);
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    } finally {
      setDeletingGiftId(null);
    }
  };

  // 🔎 Handler "Voir la liste"
  const handleViewList = async (wishlistId: string | null) => {
    if (!wishlistId) {
      setToast({
        message: "Cette liste n'existe plus ou a été supprimée.",
        type: 'error',
      });
      return;
    }

    try {
      setLoadingListId(wishlistId);
      const { data, error } = await supabase
        .from('wishlists')
        .select('slug')
        .eq('id', wishlistId)
        .single();

      if (error || !data?.slug) {
        setToast({
          message: "Cette liste n'est plus accessible.",
          type: 'error',
        });
        return;
      }

      navigate(`/list/${data.slug}`);
    } catch (err) {
      console.error('❌ Exception handleViewList:', err);
      setToast({
        message: "Erreur inattendue lors de l'ouverture de la liste.",
        type: 'error',
      });
    } finally {
      setLoadingListId(null);
    }
  };

  const hasInAppClaims = claims.length > 0;
  const hasExternalGifts = externalGifts.length > 0;

  if (!hasInAppClaims && !hasExternalGifts && !loadingExternal) {
    return (
      <>
        <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-6xl icon-bounce-active mb-4">🎯</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Aucune réservation
          </h3>
          <p className="text-gray-600 mb-6">
            Les cadeaux que tu réserves apparaîtront ici.
          </p>
          <button
            onClick={() => navigate('/budgets')}
            className={`
              inline-flex items-center gap-2
              px-6 py-3
              bg-gradient-to-r from-purple-600 to-blue-600
              hover:from-purple-700 hover:to-blue-700
              text-white font-semibold
              rounded-xl shadow-lg hover:shadow-xl
              transition-all hover:scale-105
              ${FOCUS_RING}
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un cadeau hors app
          </button>
        </div>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* 🎁 SECTION 1 : CADEAUX IN-APP */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {hasInAppClaims && (
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              🎁 Cadeaux réservés dans l'app ({claims.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {claims.map((claim) => {
                const isArchived =
                  claim.items.wishlist_id === null &&
                  claim.items.original_wishlist_name;

                const wishlistIdForCard =
                  claim.items.wishlist_id ?? claim.wishlist?.id ?? '';

                const listName =
                  claim.items?.wishlists?.name ||
                  claim.items.original_wishlist_name ||
                  'Liste inconnue';

                return (
                  <div key={claim.id} className="relative">
                    {/* Badge "Retiré" */}
                    {isArchived && (
                      <div
                        className="absolute top-2 left-2 z-10 px-2 py-1 bg-gray-500/90 backdrop-blur text-white text-xs font-bold rounded-full"
                        role="status"
                        aria-live="polite"
                      >
                        ⚠️ Retiré
                      </div>
                    )}

                    {/* Badge "Voir la liste" */}
                    {!isArchived && claim.items.wishlist_id && (
                      <button
                        onClick={() => handleViewList(claim.items.wishlist_id)}
                        disabled={loadingListId === claim.items.wishlist_id}
                        className={`
                          absolute top-2 right-2 z-10
                          flex items-center gap-1.5
                          px-3 py-1.5
                          bg-gradient-to-r from-purple-500 to-purple-600
                          hover:from-purple-600 hover:to-purple-700
                          text-white text-xs font-medium
                          rounded-full shadow-lg
                          transition-all duration-200
                          hover:scale-105
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${FOCUS_RING}
                        `}
                        aria-label={`Voir la liste ${listName}`}
                      >
                        {loadingListId === claim.items.wishlist_id ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            <span>Chargement...</span>
                          </>
                        ) : (
                          <>
                            <span className="max-w-[100px] truncate">{listName}</span>
                            <svg
                              className="w-3.5 h-3.5 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </>
                        )}
                      </button>
                    )}

                    {/* ItemCard */}
                    <ItemCard
                      item={claim.items}
                      isOwner={false}
                      canClaim={false}
                      wishlistId={wishlistIdForCard}
                      onClaimChange={onRefresh}
                    />

                    {/* Message archivé */}
                    {isArchived && (
                      <div className="mt-2 px-3 py-2 bg-orange-50 border-l-4 border-orange-400 rounded text-xs text-orange-800">
                        <p className="font-semibold">
                          Cet article a été retiré de "{claim.items.original_wishlist_name}".
                        </p>
                        <p className="mt-1 text-orange-700">
                          Tu peux <span className="font-bold">annuler ta réservation</span> si tu le souhaites.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* 🛍️ SECTION 2 : CADEAUX HORS APP */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              🛍️ Cadeaux achetés ailleurs ({externalGifts.length})
            </h2>
            <button
              onClick={() => navigate('/budgets')}
              className={`
                inline-flex items-center gap-2
                px-4 py-2
                bg-gradient-to-r from-purple-600 to-blue-600
                hover:from-purple-700 hover:to-blue-700
                text-white font-semibold text-sm
                rounded-xl shadow-lg hover:shadow-xl
                transition-all hover:scale-105
                ${FOCUS_RING}
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter
            </button>
          </div>

          {loadingExternal ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
            </div>
          ) : externalGifts.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-gray-600 text-lg mb-4">
                Aucun cadeau hors app enregistré
              </p>
              <p className="text-gray-500 text-sm">
                Ajoute les cadeaux que tu as achetés en dehors de l'app pour suivre ton budget global !
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {externalGifts.map((gift) => {
                // ✅ Déterminer emoji + label thème
                const themeEmoji = {
                  'noël': '🎄',
                  'anniversaire': '🎂',
                  'mariage': '💍',
                  'naissance': '👶',
                  'autre': '🎁'
                }[gift.theme || 'autre'] || '🎁';

                const themeLabel = {
                  'noël': 'Noël',
                  'anniversaire': 'Anniversaire',
                  'mariage': 'Mariage',
                  'naissance': 'Naissance',
                  'autre': 'Autre'
                }[gift.theme || 'autre'] || 'Autre';

                return (
                  <div
                    key={gift.id}
                    className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-purple-200/50 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
                  >
                    {/* ✅ Header avec emoji + thème (fond blanc) */}
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200/50">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{themeEmoji}</span>
                        <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                          {themeLabel}
                        </span>
                      </div>

                      {/* Bouton supprimer */}
                      <button
                        onClick={() => handleDeleteExternalGift(gift.id)}
                        disabled={deletingGiftId === gift.id}
                        className={`
                          p-1.5 rounded-lg
                          bg-red-100 hover:bg-red-200
                          text-red-600 hover:text-red-700
                          transition-all
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${FOCUS_RING}
                        `}
                        aria-label="Supprimer"
                        title="Supprimer ce cadeau"
                      >
                        {deletingGiftId === gift.id ? (
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* ✅ Contenu */}
                    <div className="p-4">
                      {/* Titre du cadeau */}
                      <h3 className="font-bold text-gray-900 text-base mb-3 line-clamp-2 min-h-[3rem]">
                        {gift.description || 'Cadeau sans titre'}
                      </h3>

                      {/* Destinataire (obligatoire) */}
                      <div className="flex items-start gap-2 mb-3 p-2 bg-purple-50 rounded-lg">
                        <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 mb-0.5">Pour</p>
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {gift.recipient_name || 'Destinataire inconnu'}
                          </p>
                        </div>
                      </div>

                      {/* Footer : Prix + Date */}
                      <div className="flex items-end justify-between pt-3 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Montant payé</p>
                          <p className="text-xl font-bold text-purple-600">
                            {formatPrice(gift.paid_amount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Acheté le</p>
                          <p className="text-sm font-semibold text-gray-700">
                            {new Date(gift.purchase_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
