// 📄 src/pages/dashboard-views/MyClaimsView.tsx
// 🧠 Vue "Mes réservations" — Badge gris archivé + message annulation


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FOCUS_RING } from '../../utils/constants';
import Toast from '../../components/Toast';
import ItemCard from '../../components/Items/ItemCard';
import type { Item } from '../../hooks/useItems';
import { supabase } from '../../lib/supabaseClient';

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

interface MyClaimsViewProps {
  claims: MyClaim[];
  onRefresh: () => void;
}

export default function MyClaimsView({ claims, onRefresh }: MyClaimsViewProps) {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loadingListId, setLoadingListId] = useState<string | null>(null);

  console.log('[MyClaimsView] render → claims =', claims);

  // 🔎 Handler "Voir la liste" : fetch slug depuis wishlist_id
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
      console.log('[MyClaimsView] handleViewList → fetch wishlist pour id =', wishlistId);

      const { data, error } = await supabase
        .from('wishlists')
        .select('slug')
        .eq('id', wishlistId)
        .single();

      if (error) {
        console.error('❌ [MyClaimsView] erreur fetch wishlist:', error);
        setToast({
          message: "Impossible d'ouvrir cette liste pour le moment.",
          type: 'error',
        });
        return;
      }

      if (!data?.slug) {
        console.warn('[MyClaimsView] wishlist trouvée mais slug manquant pour id =', wishlistId);
        setToast({
          message: "Cette liste n'est plus accessible.",
          type: 'error',
        });
        return;
      }

      console.log('[MyClaimsView] navigation → /list/', data.slug);
      navigate(`/list/${data.slug}`);
    } catch (err) {
      console.error('❌ [MyClaimsView] exception handleViewList:', err);
      setToast({
        message: "Erreur inattendue lors de l'ouverture de la liste.",
        type: 'error',
      });
    } finally {
      setLoadingListId(null);
    }
  };

  if (claims.length === 0) {
    return (
      <>
        <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-6xl icon-bounce-active mb-4">🎯</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Aucune réservation
          </h3>
          <p className="text-gray-600">
            Les cadeaux que tu réserves apparaîtront ici.
          </p>
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
      <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Mes réservations ({claims.length})
        </h2>

        {/* Grille responsive */}
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

            console.log('[MyClaimsView] claim =', {
              id: claim.id,
              itemWishlistId: claim.items.wishlist_id,
              isArchived,
              wishlistIdForCard,
            });

            return (
              <div key={claim.id} className="relative">
                {/* ═══════════════════════════════════════════════════════════════════ */}
                {/* 🔴 BADGE "RETIRÉ" (top-left, style liste supprimée) */}
                {/* ═══════════════════════════════════════════════════════════════════ */}
                {isArchived && (
                  <div
                    className="absolute top-2 left-2 z-10 px-2 py-1 bg-gray-500/90 backdrop-blur text-white text-xs font-bold rounded-full"
                    role="status"
                    aria-live="polite"
                  >
                    ⚠️ Retiré
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════════ */}
                {/* 🏷️ BADGE "LISTE" (top-right, cliquable si actif) */}
                {/* ═══════════════════════════════════════════════════════════════════ */}
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

                {/* ═══════════════════════════════════════════════════════════════════ */}
                {/* 🎁 ITEM CARD (standard, réutilisable) */}
                {/* ═══════════════════════════════════════════════════════════════════ */}
                <ItemCard
                  item={claim.items}
                  isOwner={false}
                  canClaim={false}
                  wishlistId={wishlistIdForCard}
                  onClaimChange={() => {
                    console.log('[MyClaimsView] onClaimChange → onRefresh()');
                    onRefresh();
                  }}
                />

                {/* ═══════════════════════════════════════════════════════════════════ */}
                {/* 💬 MESSAGE ARCHIVÉ : encourager à annuler */}
                {/* ═══════════════════════════════════════════════════════════════════ */}
                {isArchived && (
                  <div className="mt-2 px-3 py-2 bg-orange-50 border-l-4 border-orange-400 rounded text-xs text-orange-800">
                    <p className="font-semibold">
                      Cet article a été retiré de "{claim.items.original_wishlist_name}".
                    </p>
                    <p className="mt-1 text-orange-700">
                      Tu peux <span className="font-bold">annuler ta réservation</span> si tu le souhaites (bouton ci-dessus).
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
