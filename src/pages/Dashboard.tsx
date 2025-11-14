/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/pages/Dashboard.tsx
// 🧠 Rôle : Orchestrateur Dashboard avec tabs + chargement données (SANS boucle)

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWishlists } from '../hooks/useWishlists';
import { supabase } from '../lib/supabaseClient';
import { FOCUS_RING } from '../utils/constants';
import CreateListModal from '../components/Lists/CreateListModal';
import ManageMembersModal from '../components/Lists/ManageMembersModal';
import ShareModal from '../components/Lists/ShareModal';
import DashboardTabs, { type DashboardTab } from '../components/DashboardTabs';
import MyWishlistsView from './dashboard-views/MyWishlistsView';
import MemberWishlistsView from './dashboard-views/MemberWishlistsView';
import MyClaimsView from './dashboard-views/MyClaimsView';
import Toast from '../components/Toast';

export default function Dashboard() {
  const { user } = useAuth();
  const { wishlists, loading, createWishlist, updateWishlist, deleteWishlist } = useWishlists();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Tab actif
  const [activeTab, setActiveTab] = useState<DashboardTab>('my-lists');

  // Données pour chaque vue
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [memberWishlists, setMemberWishlists] = useState<any[]>([]);
  const [myClaims, setMyClaims] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Modals
  const [listModal, setListModal] = useState<{
    open: boolean;
    editMode: boolean;
    wishlist: any | null;
  }>({ open: false, editMode: false, wishlist: null });

  const [manageMembersModal, setManageMembersModal] = useState<{
    open: boolean;
    wishlistId: string | null;
  }>({ open: false, wishlistId: null });

  const [shareModal, setShareModal] = useState<{
    open: boolean;
    wishlist: any | null;
  }>({ open: false, wishlist: null });

  // ⬅️ Charger toutes les données (SANS useCallback pour éviter la boucle)
useEffect(() => {
  const loadData = async () => {
    if (!user) {
      console.log('⏭️ Pas d\'utilisateur connecté');
      setDataLoading(false);
      return;
    }

    console.log('🔵 Chargement des données Dashboard pour:', user.id);
    setDataLoading(true);

    try {
      // 1️⃣ Compteurs items + membres (pour mes listes)
      if (wishlists.length > 0) {
        const ids = wishlists.map((w) => w.id);

        // Items counts
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('id, wishlist_id')
          .in('wishlist_id', ids);

        if (itemsError) {
          console.error('❌ Erreur chargement items:', itemsError);
        } else {
          const iCounts: Record<string, number> = {};
          for (const item of itemsData ?? []) {
            iCounts[item.wishlist_id] = (iCounts[item.wishlist_id] || 0) + 1;
          }
          setItemCounts(iCounts);
          console.log('✅ Items counts chargés:', iCounts);
        }

        // Members counts
        const { data: membersData, error: membersError } = await supabase
          .from('wishlist_members')
          .select('wishlist_id')
          .in('wishlist_id', ids)
          .eq('status', 'actif');

        if (membersError) {
          console.error('❌ Erreur chargement membres:', membersError);
        } else {
          const mCounts: Record<string, number> = {};
          for (const m of membersData ?? []) {
            mCounts[m.wishlist_id] = (mCounts[m.wishlist_id] || 0) + 1;
          }
          setMemberCounts(mCounts);
          console.log('✅ Members counts chargés:', mCounts);
        }
      }

      // 2️⃣ Listes où je suis membre
      console.log('🔵 Chargement listes membres...');
      const { data: memberLists, error: memberListsError } = await supabase
        .from('wishlist_members')
        .select(`
          wishlist_id,
          user_id,
          status,
          role,
          wishlists!inner(
            id,
            name,
            slug,
            theme,
            description,
            owner_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'actif');

      if (memberListsError) {
        console.error('❌ Erreur chargement listes membres:', memberListsError);
        console.error('Details:', memberListsError.details);
        console.error('Hint:', memberListsError.hint);
        console.error('Code:', memberListsError.code);
      } else {
        console.log('🔵 Listes membres brutes:', memberLists?.length, memberLists);

        // Reformater pour correspondre à l'interface MemberWishlist
        const formatted = (memberLists || []).map((member: any) => ({
          wishlist_id: member.wishlist_id,
          user_id: member.user_id,
          role: member.role,
          status: member.status,
          wishlist: {
            id: member.wishlists.id,
            name: member.wishlists.name,
            slug: member.wishlists.slug,
            theme: member.wishlists.theme,
            description: member.wishlists.description
          }
        }));

        setMemberWishlists(formatted);
        console.log('✅ Listes membres formatées:', formatted.length, formatted);
      }

      // 3️⃣ Mes claims (réservations)
      console.log('🔵 Chargement mes claims...');
      const { data: claims, error: claimsError } = await supabase
        .from('claims')
        .select(`
          id,
          created_at,
          status,
          items!inner(
            id,
            title,
            price,
            url,
            image_url,
            priority,
            status,
            wishlist_id,
            original_wishlist_name,
            original_owner_id,
            wishlists (
              id,
              name,
              slug,
              owner_id
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'réservé')
        .order('created_at', { ascending: false });

      if (claimsError) {
        console.error('❌ Erreur chargement claims:', claimsError);
      } else {
        console.log('✅ Claims chargés:', claims?.length);
        console.log('🔍 Premier claim:', claims?.[0]);
console.log('🔍 Wishlist du premier claim:', (claims?.[0] as any)?.items?.wishlists);
        setMyClaims(claims || []);
      }
    } catch (error) {
      console.error('❌ Erreur globale chargement données:', error);
    } finally {
      setDataLoading(false);
    }
  };

  loadData();
}, [user?.id, wishlists.length]);

  // Handlers
  const handleSubmitList = async (data: any) => {
    if (listModal.editMode && listModal.wishlist) {
      try {
        await updateWishlist(listModal.wishlist.id, data);
        setToast({ message: '✅ Liste modifiée !', type: 'success' });
        setListModal({ open: false, editMode: false, wishlist: null });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        setToast({ message: `❌ ${errorMessage}`, type: 'error' });
      }
    } else {
      try {
        await createWishlist(data);
        setToast({ message: '✅ Liste créée !', type: 'success' });
        setListModal({ open: false, editMode: false, wishlist: null });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        setToast({ message: `❌ ${errorMessage}`, type: 'error' });
      }
    }
  };

  const handleDeleteList = async (wishlistId: string, _name: string) => {
    try {
      const result = await deleteWishlist(wishlistId);
      if (result && result.action !== 'cancelled') {
        setToast({ message: result.message, type: 'success' });
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      setToast({ message: '❌ Erreur lors de la suppression', type: 'error' });
    }
  };

  // ⬅️ Refresh manuel (pas de reload page)
  const handleRefreshClaims = async () => {
    if (!user) return;

    console.log('🔄 Rafraîchissement claims...');

    const { data: claims } = await supabase
      .from('claims')
      .select(`
        id,
        created_at,
        items!inner(
          id,
          title,
          price,
          url,
          image_url,
          priority,
          status,
          wishlist_id,
          original_wishlist_name,
          original_owner_id
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'réservé')
      .order('created_at', { ascending: false });

    const enriched = await Promise.all(
      (claims || []).map(async (claim: any) => {
        if (claim.items?.wishlist_id) {
          const { data: wishlist } = await supabase
            .from('wishlists')
            .select(`
              id,
              name,
              slug,
              owner_id,
              profiles:owner_id(username, pseudo)
            `)
            .eq('id', claim.items.wishlist_id)
            .single();

          return { ...claim, wishlist };
        }
        return claim;
      })
    );

    setMyClaims(enriched);
    console.log('✅ Claims rafraîchis');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Bonjour {user?.display_name || user?.email?.split('@')[0]} !
              </span>
              <span className="ml-2 icon-shake-once">👋</span>
            </h1>
          </div>

          {activeTab === 'my-lists' && (
            <button
              onClick={() => setListModal({ open: true, editMode: false, wishlist: null })}
              className={`inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 ${FOCUS_RING}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Nouvelle liste</span>
              <span className="sm:hidden">Nouveau</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <DashboardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{
            myLists: wishlists.length,
            memberLists: memberWishlists.length,
            myClaims: myClaims.length,
          }}
        />

        {/* Loading */}
        {(loading || dataLoading) ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 mx-auto text-purple-600 mb-4" viewBox="0 0 24 24">
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
              <p className="text-gray-600">Chargement...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Vues */}
            {activeTab === 'my-lists' && (
              <MyWishlistsView
                wishlists={wishlists}
                itemCounts={itemCounts}
                memberCounts={memberCounts}
                onCreateList={() => setListModal({ open: true, editMode: false, wishlist: null })}
                onEditList={(wishlist) => setListModal({ open: true, editMode: true, wishlist })}
                onManageMembers={(wishlistId) => setManageMembersModal({ open: true, wishlistId })}
                onShareList={(wishlist) => setShareModal({ open: true, wishlist })}
                onDeleteList={handleDeleteList}
              />
            )}

            {activeTab === 'member-lists' && (
              <MemberWishlistsView memberWishlists={memberWishlists} />
            )}

            {activeTab === 'my-claims' && (
              <MyClaimsView
                claims={myClaims}
                onRefresh={handleRefreshClaims}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreateListModal
        isOpen={listModal.open}
        onClose={() => setListModal({ open: false, editMode: false, wishlist: null })}
        onSubmit={handleSubmitList}
        editMode={listModal.editMode}
        initialData={
          listModal.editMode && listModal.wishlist
            ? {
                name: listModal.wishlist.name,
                description: listModal.wishlist.description || '',
                theme: listModal.wishlist.theme,
                visibility: listModal.wishlist.visibility,
              }
            : undefined
        }
      />

      {manageMembersModal.wishlistId && (
        <ManageMembersModal
          isOpen={manageMembersModal.open}
          onClose={() => setManageMembersModal({ open: false, wishlistId: null })}
          wishlistId={manageMembersModal.wishlistId}
          isOwner={true}
        />
      )}

      {shareModal.wishlist && (
        <ShareModal
          isOpen={shareModal.open}
          onClose={() => setShareModal({ open: false, wishlist: null })}
          wishlistSlug={shareModal.wishlist.slug}
          wishlistName={shareModal.wishlist.name}
          visibility={shareModal.wishlist.visibility}
        />
      )}
    </div>
  );
}
