// 📄 ListView.tsx
// 🧠 Rôle : Page de détail d'une liste avec items
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useItems } from '../hooks/useItems';
import { FOCUS_RING, BANNER_HEIGHT, ITEM_SORT_OPTIONS } from '../utils/constants';
import { BannerMap } from '../components/banners';
import type { Wishlist } from '../hooks/useWishlists';
import SortDropdown from '../components/SortDropdown';
import FilterButtons, { type StatusFilter } from '../components/FilterButtons';
import { sortItems, filterItemsByStatus } from '../utils/sorting';
import AddItemModal from '../components/AddItemModal';
import ItemCard from '../components/ItemCard';
import ListStats from '../components/ListStats';
import OwnerStats from '../components/OwnerStats';
import Toast from '../components/Toast';
import ShareModal from '../components/ShareModal';

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

  // États du tri et filtrage
  const [sortBy, setSortBy] = useState('priority-desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('tous');

  // Filtrer puis trier les items
  const filteredItems = filterItemsByStatus(items, statusFilter);
  const sortedItems = sortItems(filteredItems, sortBy);

  // Compter les items par statut
  const statusCounts = {
    tous: items.length,
    disponible: items.filter(i => i.status === 'disponible').length,
    réservé: items.filter(i => i.status === 'réservé').length,
    acheté: items.filter(i => i.status === 'acheté').length
  };

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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

  // ⬅️ NOUVEAU : Gérer les utilisateurs invités
  useEffect(() => {
    const handleInvitedUser = async () => {
      // Vérifier si l'URL contient ?invited=true
      const urlParams = new URLSearchParams(window.location.search);
      const isInvited = urlParams.get('invited') === 'true';

      if (!isInvited || !wishlist?.id) return;

      console.log('👤 Utilisateur invité détecté');

      // Récupérer l'utilisateur connecté
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        console.log('❌ Pas d\'utilisateur connecté');
        return;
      }

      console.log('✅ User connecté:', currentUser.id, currentUser.email);

      // Vérifier s'il y a une invitation en attente pour cet email
      const { data: invitation } = await supabase
        .from('wishlist_members')
        .select('id, status')
        .eq('wishlist_id', wishlist.id)
        .eq('email', currentUser.email)
        .eq('status', 'invité')
        .maybeSingle();

      if (!invitation) {
        console.log('❌ Pas d\'invitation valide trouvée');
        setToast({
          message: '❌ Aucune invitation trouvée pour cet email',
          type: 'error'
        });
        // Nettoyer l'URL
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      console.log('✅ Invitation trouvée, activation...');

      // Activer l'invitation
      const { error: updateError } = await supabase
        .from('wishlist_members')
        .update({
          user_id: currentUser.id,
          status: 'actif',
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('❌ Erreur activation:', updateError);
        setToast({
          message: '❌ Erreur lors de l\'activation de l\'invitation',
          type: 'error'
        });
        return;
      }

      console.log('✅ Invitation activée avec succès');

      setToast({
        message: '✅ Bienvenue ! Tu as rejoint la liste avec succès 🎉',
        type: 'success'
      });

      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);

      // Recharger la page pour afficher les bonnes permissions
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    };

    if (wishlist && wishlist.id) {
      handleInvitedUser();
    }
  }, [wishlist?.id]);

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

        {/* Bouton Partager */}
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="absolute top-4 left-16 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg transition-all hover:scale-105 font-semibold text-gray-700"
          aria-label="Partager"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="hidden sm:inline">Partager</span>
        </button>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-16 relative z-10">

        {/* Card principale */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">

          {/* Actions header */}
          <div className="flex flex-col gap-4 mb-8 pb-6 border-b">
            {/* Ligne 1 : Titre + Bouton ajouter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Cadeaux de la liste
                </h2>
                <p className="text-gray-600 text-sm">
                  {sortedItems.length} / {items.length} cadeau{items.length > 1 ? 'x' : ''}
                </p>
              </div>

              {isOwner && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all ${FOCUS_RING} whitespace-nowrap`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Ajouter un cadeau</span>
                  <span className="sm:hidden">Ajouter</span>
                </button>
              )}
            </div>

            {/* Ligne 2 : Filtres (viewers only) + Tri */}
            {items.length > 0 && (
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Filtres pour viewers */}
                {!isOwner && (
                  <div className="flex-1">
                    <FilterButtons
                      value={statusFilter}
                      onChange={setStatusFilter}
                      counts={statusCounts}
                    />
                  </div>
                )}

                {/* Tri */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 font-medium whitespace-nowrap">Trier par :</span>
                  <SortDropdown
                    options={ITEM_SORT_OPTIONS}
                    value={sortBy}
                    onChange={setSortBy}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Liste des items ou empty state */}
          {sortedItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                {items.length === 0 ? '🎁' : '🔍'}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {items.length === 0
                  ? 'Aucun cadeau pour le moment'
                  : 'Aucun résultat'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {items.length === 0
                  ? (isOwner
                      ? 'Commence à ajouter tes envies de cadeaux !'
                      : 'Le propriétaire de la liste n\'a pas encore ajouté de cadeaux.')
                  : 'Essaie de changer les filtres ou le tri.'
                }
              </p>
              {isOwner && items.length === 0 && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {sortedItems.map((item) => (
                <ItemCard key={item.id} item={item} isOwner={isOwner} />
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {items.length > 0 && (
          <div className="mt-6">
            {isOwner ? (
              <OwnerStats items={items} />
            ) : (
              <ListStats items={items} />
            )}
          </div>
        )}
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

      {/* Modal partage */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        wishlistId={wishlist.id}
        wishlistSlug={wishlist.slug}
        wishlistName={wishlist.name}
        visibility={wishlist.visibility}
      />
    </div>
  );
}
