/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 Dashboard.tsx
// 🧠 Rôle : Dashboard utilisateur avec affichage des listes
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWishlists } from '../hooks/useWishlists';
import { supabase } from '../lib/supabaseClient';
import { FOCUS_RING, THEMES } from '../utils/constants';
import CreateListModal from '../components/CreateListModal';
import Toast from '../components/Toast';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { wishlists, loading, createWishlist } = useWishlists();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  // 👉 compteur d’items par liste
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});

  // 🧮 charger le nombre d’items pour chaque wishlist
  useEffect(() => {
    const loadCounts = async () => {
      if (!wishlists.length) return;

      const ids = wishlists.map((w) => w.id);
      const { data, error } = await supabase
        .from('items')
        .select('id, wishlist_id')
        .in('wishlist_id', ids);

      if (error) {
        console.error('❌ Erreur chargement items :', error);
        return;
      }

      const counts: Record<string, number> = {};
      for (const item of data ?? []) {
        counts[item.wishlist_id] = (counts[item.wishlist_id] || 0) + 1;
      }

      setItemCounts(counts);
    };

    loadCounts();
  }, [wishlists]);

  const handleCreateList = async (data: any) => {
    try {
      console.log('🔵 Dashboard - handleCreateList appelé avec:', data);
      await createWishlist(data);
      setToast({ message: '✅ Liste créée avec succès !', type: 'success' });
    } catch (error) {
      console.error('❌ Dashboard - Erreur:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue lors de la création';

      setToast({
        message: `❌ ${errorMessage}`,
        type: 'error',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header responsive */}
        <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Bonjour {user?.pseudo || user?.email?.split('@')[0]} !
              </span>
              <span className="ml-2">👋</span>
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              {wishlists.length === 0
                ? 'Prêt à organiser tes cadeaux ?'
                : `Tu as ${wishlists.length} liste${wishlists.length > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Bouton créer */}
          <button
            onClick={() => setIsModalOpen(true)}
            className={`inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 ${FOCUS_RING}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Nouvelle liste</span>
          </button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 mx-auto text-purple-600 mb-4"
                viewBox="0 0 24 24"
              >
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-gray-600">Chargement de tes listes...</p>
            </div>
          </div>
        ) : wishlists.length === 0 ? (
          /* Empty state */
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-white/20 p-6 sm:p-8 md:p-12">
            <div className="max-w-2xl mx-auto text-center">
              {/* Illustration SVG */}
              <div className="mb-6 sm:mb-8">
                <svg
                  className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="60" y="80" width="80" height="70" fill="url(#giftGrad)" rx="4" />
                  <rect x="60" y="80" width="80" height="12" fill="#ec4899" />
                  <rect x="96" y="60" width="8" height="90" fill="#ec4899" />
                  <ellipse cx="85" cy="65" rx="12" ry="8" fill="#f43f5e" />
                  <ellipse cx="115" cy="65" rx="12" ry="8" fill="#f43f5e" />
                  <circle cx="100" cy="60" r="6" fill="#be123c" />
                  <defs>
                    <linearGradient id="giftGrad" x1="60" y1="80" x2="140" y2="150">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Texte */}
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                Ta première liste t'attend ! 🎁
              </h2>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-relaxed px-2">
                Crée une liste pour <strong>Noël</strong>, un <strong>anniversaire</strong>,
                une <strong>naissance</strong> ou un <strong>mariage</strong>.
                Ajoute tes envies, partage avec tes proches et évite les doublons !
              </p>

              {/* CTA Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className={`group relative inline-flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white text-base sm:text-lg font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105 ${FOCUS_RING}`}
              >
                <span className="relative z-10">➕ Créer ma première liste</span>
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* Liste des wishlists */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {wishlists.map((wishlist) => {
              const themeData = THEMES[wishlist.theme];
              const themeColors = themeData.colors;
              const count = itemCounts[wishlist.id] ?? 0;

              return (
                <div
                  key={wishlist.id}
                  className="group relative bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100"
                >
                  {/* Header avec gradient du thème */}
                  <div
                    className="h-32 sm:h-40 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${themeColors[0]}, ${themeColors[1]}, ${themeColors[2]})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-4xl sm:text-5xl mb-2 drop-shadow-lg">
                          {themeData.label.split(' ')[1]}
                        </div>
                      </div>
                    </div>

                    {/* Badge visibilité */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-white/90 backdrop-blur text-xs font-medium rounded-full text-gray-700">
                        {wishlist.visibility === 'privée' && '🔒 Privée'}
                        {wishlist.visibility === 'partagée' && '🔗 Partagée'}
                        {wishlist.visibility === 'publique' && '🌍 Publique'}
                      </span>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                      {wishlist.name}
                    </h3>

                    {wishlist.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {wishlist.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{new Date(wishlist.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                          />
                        </svg>
                        <span>
                          {count} {count > 1 ? 'cadeaux' : 'cadeau'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/list/${wishlist.slug}`)}
                        className={`flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all ${FOCUS_RING}`}
                      >
                        Voir la liste
                      </button>
                      <button
                        className={`p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all ${FOCUS_RING}`}
                        aria-label="Plus d'options"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal création liste */}
      <CreateListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateList}
      />
    </div>
  );
}
