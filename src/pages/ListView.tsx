/* eslint-disable @typescript-eslint/no-unused-vars */
// 📄 ListView.tsx
// 🧠 Rôle : Page de détail d'une liste avec items
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useItems } from '../hooks/useItems';
import { FOCUS_RING, BANNER_HEIGHT } from '../utils/constants';
import { BannerMap } from '../components/banners';
import type { Wishlist } from '../hooks/useWishlists';
import AddItemModal from '../components/AddItemModal';
import ItemCard from '../components/ItemCard';
import ListStats from '../components/ListStats';
import Toast from '../components/Toast';

export default function ListView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { items, createItem } = useItems(wishlist?.id);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Charger la liste
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!slug) {
        setError('Slug manquant');
        setLoading(false);
        return;
      }

      try {
        console.log('🔵 Chargement wishlist:', slug);

        const { data, error: fetchError } = await supabase
          .from('wishlists')
          .select('*')
          .eq('slug', slug)
          .single();

        if (fetchError) {
          console.error('❌ Erreur fetch wishlist:', fetchError);
          throw fetchError;
        }

        if (!data) {
          throw new Error('Liste introuvable');
        }

        console.log('✅ Wishlist chargée:', data);
        setWishlist(data);
        setError(null);
      } catch (err) {
        console.error('❌ Erreur:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [slug]);

  // Handler ajout item
  const handleAddItem = async (data: {
    name: string;
    description: string;
    url: string;
    image_url: string;
    price: number;
    priority: 'basse' | 'moyenne' | 'haute';
    size: string;
    color: string;
    promo_code: string;
  }) => {
    try {
      await createItem(data);
      setToast({ message: '✅ Cadeau ajouté avec succès !', type: 'success' });
    } catch (error) {
      console.error('❌ Erreur:', error);
      setToast({ message: '❌ Erreur lors de l\'ajout', type: 'error' });
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-purple-600 mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Chargement de la liste...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !wishlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Liste introuvable</h1>
          <p className="text-gray-600 mb-6">{error || 'Cette liste n\'existe pas ou a été supprimée.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all ${FOCUS_RING}`}
          >
            ← Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  // const themeData = THEMES[wishlist.theme];
  const BannerComponent = BannerMap[wishlist.theme];
  const isOwner = user?.id === wishlist.owner_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Bannière avec le thème */}
      <div className="relative overflow-hidden">
        <BannerComponent height={BANNER_HEIGHT.medium} />

        {/* Overlay content */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center text-white max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">
              {wishlist.name}
            </h1>
            {wishlist.description && (
              <p className="text-base sm:text-lg opacity-95 drop-shadow">
                {wishlist.description}
              </p>
            )}
          </div>
        </div>

        {/* Badge visibilité */}
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1.5 bg-white/90 backdrop-blur text-sm font-medium rounded-full text-gray-700">
            {wishlist.visibility === 'privée' && '🔒 Privée'}
            {wishlist.visibility === 'partagée' && '🔗 Partagée'}
            {wishlist.visibility === 'publique' && '🌍 Publique'}
          </span>
        </div>

        {/* Bouton retour */}
        <button
          onClick={() => navigate('/dashboard')}
          className="absolute top-4 left-4 p-2 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg transition-all hover:scale-110"
          aria-label="Retour"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-16 relative z-10">

        {/* Card principale */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">

          {/* Actions header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Cadeaux de la liste
              </h2>
              <p className="text-gray-600 text-sm">
                {items.length} cadeau{items.length > 1 ? 'x' : ''} ajouté{items.length > 1 ? 's' : ''}
              </p>
            </div>

            {isOwner && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className={`inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all ${FOCUS_RING}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Ajouter un cadeau</span>
              </button>
            )}
          </div>

          {/* Liste des items ou empty state */}
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Aucun cadeau pour le moment
              </h3>
              <p className="text-gray-600 mb-6">
                {isOwner
                  ? 'Commence à ajouter tes envies de cadeaux !'
                  : 'Le propriétaire de la liste n\'a pas encore ajouté de cadeaux.'
                }
              </p>
              {isOwner && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all ${FOCUS_RING}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Ajouter mon premier cadeau</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} isOwner={isOwner} />
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6">
          <ListStats items={items} />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal ajout item */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddItem}
      />
    </div>
  );
}
