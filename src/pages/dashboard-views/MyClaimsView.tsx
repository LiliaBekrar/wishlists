// 📄 src/pages/dashboard-views/MyClaimsView.tsx
// 🧠 Vue "Mes réservations" basée sur ItemCard

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FOCUS_RING } from '../../utils/constants';
import Toast from '../../components/Toast';
import ItemCard from '../../components/Items/ItemCard';
import type { Item } from '../../hooks/useItems';

interface MyClaim {
  id: string;
  items: Item & {
    wishlist_id: string | null;
    original_wishlist_name: string | null;
    original_owner_id: string | null;
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
  onRefresh: () => void; // callback pour refetch les réservations
}

export default function MyClaimsView({ claims, onRefresh }: MyClaimsViewProps) {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

            return (
              <div key={claim.id} className="relative space-y-2">
                {/* Badge "Liste supprimée" si orphelin */}
                {!claim.items.wishlist_id && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-gray-500/90 backdrop-blur text-white text-xs font-bold rounded-full">
                    📦 Liste supprimée
                  </div>
                )}

                {/* Badge info liste (juste le nom) */}
                {claim.wishlist && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs shadow-sm">
                      <div className="font-semibold text-gray-900 truncate max-w-[140px]">
                        {claim.wishlist.name}
                      </div>
                    </div>
                  </div>
                )}

                {/* ✅ Réutilisation de ItemCard */}
                <ItemCard
                  item={claim.items}
                  isOwner={false}            // tu n’es pas owner ici
                  canClaim={false}           // déjà réservé → on veut juste le bouton "Annuler" si c'est toi
                  wishlistId={wishlistIdForCard}
                  onClaimChange={() => {
                    onRefresh();
                  }}
                />

                {/* Bouton "Voir la liste" en dessous si besoin */}
                {claim.wishlist?.slug && (
                  <button
                    onClick={() => navigate(`/list/${claim.wishlist!.slug}`)}
                    className={`w-full inline-flex items-center justify-center gap-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 text-sm font-semibold rounded-lg transition-all ${FOCUS_RING}`}
                  >
                    📋 Voir la liste
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
