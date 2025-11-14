/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 ListView.tsx
// 🧠 Rôle : Page de détail d'une liste avec gestion des accès + membres + quitter

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useItems } from '../hooks/useItems';
import { useMembers } from '../hooks/useMembers';
import { BannerMap } from '../components/banners';
import type { Wishlist } from '../hooks/useWishlists';
import Toast from '../components/Toast';
import ShareModal from '../components/Lists/ShareModal';
import ManageMembersModal from '../components/Lists/ManageMembersModal';
import LeaveListModal from '../components/Lists/LeaveListModal';
import { useListAccess } from './list-view/useListAccess';
import AccessDeniedScreen from './list-view/AccessDeniedScreen';
import AccessPendingScreen from './list-view/AccessPendingScreen';
import ListViewHeader from './list-view/ListViewHeader';
import ListViewContent from './list-view/ListViewContent';

export default function ListView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const {
    items,
    loading: itemsLoading,
    error: _itemsError,
    fetchItems,
    createItem,
    deleteItem,
  } = useItems(wishlist?.id);

  const { accessStatus, requestSending, handleRequestAccess, refreshAccess } = useListAccess(
    wishlist,
    user?.id
  );

  const { leaveMembership, loading: leavingList } = useMembers(wishlist?.id);

  // Valeurs mémoïsées pour éviter les re-renders
  const isOwner = useMemo(() => user?.id === wishlist?.owner_id, [user?.id, wishlist?.owner_id]);
  const isMember = useMemo(() => accessStatus === 'granted', [accessStatus]);
  const canClaim = useMemo(
    () => {
      if (accessStatus === 'granted') return true;
      if (accessStatus === 'guest' && wishlist?.visibility === 'publique') return true;
      return false;
    },
    [accessStatus, wishlist?.visibility]
  );

  // Realtime : Écouter les changements de membres
  useEffect(() => {
    if (!wishlist || !user) return;

    const channel = supabase
      .channel(`wishlist-members-${wishlist.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wishlist_members',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Mise à jour membre:', payload);
          refreshAccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wishlist?.id, user?.id]);

  // Charger la wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!slug) {
        setError('Slug manquant');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('wishlists')
          .select('*')
          .eq('slug', slug)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Liste introuvable');

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

  // Handler demande d'accès
  const handleRequestAccessWithToast = async () => {
    try {
      await handleRequestAccess();
      setToast({
        message: '✅ Demande envoyée ! Le propriétaire va la valider.',
        type: 'success',
      });
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      setToast({
        message: error.message || "❌ Erreur lors de l'envoi de la demande",
        type: 'error',
      });
    }
  };

  // Handler quitter la liste
  const handleLeaveList = async () => {
    if (!wishlist || !user) return;

    try {
      await leaveMembership(user.id);
      setToast({ message: '✅ Tu as quitté la liste', type: 'success' });
      setIsLeaveModalOpen(false);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      setToast({
        message: error.message || '❌ Erreur lors de la sortie',
        type: 'error',
      });
    }
  };

  // Loading
  if (loading || itemsLoading || accessStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-purple-600 mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-600">Chargement de la liste...</p>
        </div>
      </div>
    );
  }

  // Erreur
  if (error || !wishlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Liste introuvable</h1>
          <p className="text-gray-600 mb-6">{error || "Cette liste n'existe pas ou a été supprimée."}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all"
          >
            ← Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  const BannerComponent = BannerMap[wishlist.theme];

  // Accès refusé
  if (accessStatus === 'denied') {
    return (
      <>
        <AccessDeniedScreen
          wishlist={wishlist}
          isLoggedIn={!!user}
          onRequestAccess={handleRequestAccessWithToast}
          requestSending={requestSending}
          BannerComponent={BannerComponent}
        />

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

  // Accès en attente
  if (accessStatus === 'pending') {
    return <AccessPendingScreen BannerComponent={BannerComponent} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <ListViewHeader
        wishlist={wishlist}
        isOwner={isOwner}
        isMember={isMember}
        onBack={() => navigate('/dashboard')}
        onShare={() => setIsShareModalOpen(true)}
        onManageMembers={() => setIsManageMembersOpen(true)}
        onLeaveList={() => setIsLeaveModalOpen(true)}
        BannerComponent={BannerComponent}
      />

    <ListViewContent
      wishlist={wishlist}
      items={items}
      isOwner={isOwner}
      canClaim={canClaim}
      onToast={setToast}
      onRequestAccess={handleRequestAccessWithToast} // ⬅️ AJOUTER CETTE LIGNE
      onAddItem={createItem}
      onDeleteItem={deleteItem}
      onRefetchItems={fetchItems}
    />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        wishlistSlug={wishlist.slug}
        wishlistName={wishlist.name}
        visibility={wishlist.visibility}
      />

      {isManageMembersOpen && (
        <ManageMembersModal
          isOpen={isManageMembersOpen}
          onClose={() => setIsManageMembersOpen(false)}
          wishlistId={wishlist.id}
          isOwner={isOwner}
        />
      )}

      <LeaveListModal
        isOpen={isLeaveModalOpen}
        wishlistName={wishlist.name}
        onConfirm={handleLeaveList}
        onCancel={() => setIsLeaveModalOpen(false)}
        loading={leavingList}
      />
    </div>
  );
}
