// 📄 src/pages/dashboard-views/MyClaimsView.tsx
// 🧠 Vue "Mes réservations" basée sur ItemCard
// 🔧 Fix : bouton "Voir la liste" basé sur items.wishlist_id + fetch du slug au clic

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
    wishlists?: {  // ⬅️ AJOUTÉ
      id: string;
      name: string;
      slug: string | null;
    };
  };
  // ⚠️ wishlist peut exister côté TS mais on ne s'y fie plus pour le bouton
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
  onRefresh: () => void; // callback pour refetch les réservations
}

export default function MyClaimsView({ claims, onRefresh }: MyClaimsViewProps) {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loadingListId, setLoadingListId] = useState<string | null>(null);

  console.log('[MyClaimsView] render → claims =', claims);

  // 🔎 Handler "Voir la liste" : on fetch le slug à partir du wishlist_id
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
        console.warn('[MyClaimsView] wishlist trouvée mais slug manquant pour id =', wishlistId, 'data =', data);
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
            const wishlistIdForCard =
              claim.items.wishlist_id ?? claim.wishlist?.id ?? '';

            console.log('[MyClaimsView] claim =', {
              id: claim.id,
              itemWishlistId: claim.items.wishlist_id,
              wishlistIdForCard,
              wishlistFromJoin: claim.wishlist,
            });

            const listNameBadge =
              claim.items?.wishlists?.name || claim.items.original_wishlist_name || 'Liste';

            const isOrphan = !claim.items.wishlist_id;

            return (
              <div key={claim.id} className="relative space-y-2">
                {/* Badge "Liste supprimée" si orphelin */}
                {isOrphan && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-gray-500/90 backdrop-blur text-white text-xs font-bold rounded-full">
                    📦 Liste supprimée
                  </div>
                )}

                {/* Badge info liste (nom) si on a quelque chose à afficher */}
                {listNameBadge && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs shadow-sm max-w-[160px]">
                      <div className="font-semibold text-gray-900 truncate">
                        {listNameBadge}
                      </div>
                    </div>
                  </div>
                )}

                {/* ✅ Réutilisation de ItemCard */}
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

                {/* Bouton "Voir la liste" → basé uniquement sur items.wishlist_id */}
                {claim.items.wishlist_id && (
                  <button
                    onClick={() => handleViewList(claim.items.wishlist_id)}
                    className={`w-full inline-flex items-center justify-center gap-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 text-sm font-semibold rounded-lg transition-all ${FOCUS_RING}`}
                    disabled={loadingListId === claim.items.wishlist_id}
                  >
                    {loadingListId === claim.items.wishlist_id ? (
                      <>
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
                        <span className="ml-1">Ouverture...</span>
                      </>
                    ) : (
                      <>
                        📋 Voir la liste
                      </>
                    )}
                  </button>
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
