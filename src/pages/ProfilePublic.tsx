/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/pages/ProfilePublic.tsx
// 🧠 Rôle : Page profil publique (utilise les composants modulaires)

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import ShareModal from '../components/Lists/ShareModal';
import ProfileBanner from '../components/Profile/ProfileBanner';
import ProfileWishlists from '../components/Profile/ProfileWishlists';

export default function ProfilePublic() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [userId, setUserId] = useState<string | null>(null);
  const [publicWishlists, setPublicWishlists] = useState<any[]>([]);
  const [sharedWishlists, setSharedWishlists] = useState<any[]>([]);
  const [wishlistsWithCounts, setWishlistsWithCounts] = useState<Map<string, number>>(new Map());
  const [loadingWishlists, setLoadingWishlists] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { profile, loading: loadingProfile } = useProfile(userId || undefined);

  const isLoading = loadingWishlists || loadingProfile;

  // Charger l'userId depuis le username
  useEffect(() => {
    const fetchUserId = async () => {
      if (!username) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (error || !data) {
        console.error('❌ Profil introuvable:', error);
        setLoadingWishlists(false);
        return;
      }

      setUserId(data.id);
    };

    fetchUserId();
  }, [username]);

  // Charger les listes + compteurs de cadeaux
  useEffect(() => {
    const fetchWishlists = async () => {
      if (!userId) return;

      // Listes publiques
      const { data: publicData } = await supabase
        .from('wishlists')
        .select('*')
        .eq('owner_id', userId)
        .eq('visibility', 'publique');

      setPublicWishlists(publicData || []);

      // Listes partagées avec moi (si connecté)
      let sharedData: any[] = [];
      if (user) {
        const { data } = await supabase
          .from('wishlist_members')
          .select(`
            wishlist_id,
            wishlists!inner(*)
          `)
          .eq('user_id', user.id)
          .eq('wishlists.owner_id', userId)
          .eq('status', 'actif');

        sharedData = data?.map((m: any) => m.wishlists) || [];
        setSharedWishlists(sharedData);
      }

      // Compter les items pour chaque liste
      const allWishlists = [...(publicData || []), ...sharedData];
      const counts = new Map<string, number>();

      for (const wishlist of allWishlists) {
        const { count } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('wishlist_id', wishlist.id);

        counts.set(wishlist.id, count || 0);
      }

      setWishlistsWithCounts(counts);
      setLoadingWishlists(false);
    };

    if (userId) {
      fetchWishlists();
    }
  }, [userId, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
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
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profil introuvable</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all"
          >
            ← Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  const displayNameFinal = profile.display_name || profile.username || '';
  const totalPublicWishlists = publicWishlists.length;
  const totalSharedWishlists = sharedWishlists.length;

  // Préparer les stats
  const stats = [
    { value: totalPublicWishlists, label: totalPublicWishlists > 1 ? 'Listes publiques' : 'Liste publique' }
  ];

  if (totalSharedWishlists > 0) {
    stats.push({
      value: totalSharedWishlists,
      label: totalSharedWishlists > 1 ? 'Listes partagées' : 'Liste partagée'
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* HEADER avec ProfileBanner */}
      <ProfileBanner
        displayName={displayNameFinal}
        username={profile.username}
        bio={profile.bio}
        avatarUrl={profile.avatar_url}
        stats={stats}
        tagline="Envie de faire plaisir ? Découvrez mes envies !"
        isPrivate={false}
        onBack={() => navigate(-1)}
        onShare={() => setIsShareModalOpen(true)}
      />

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-4 mt-10 relative z-10 pb-12 space-y-8">
        {/* Listes publiques avec ProfileWishlists */}
        <ProfileWishlists
          title="Listes publiques"
          icon="🌍"
          wishlists={publicWishlists}
          wishlistsWithCounts={wishlistsWithCounts}
          emptyMessage="Aucune liste publique pour le moment."
          emptySubtitle={`Revenez bientôt pour découvrir les envies de ${displayNameFinal} !`}
          colorScheme="purple"
        />

        {/* Listes partagées avec ProfileWishlists */}
        {sharedWishlists.length > 0 && (
          <ProfileWishlists
            title="Listes partagées avec vous"
            icon="🤝"
            wishlists={sharedWishlists}
            wishlistsWithCounts={wishlistsWithCounts}
            emptyMessage=""
            description="Ces listes sont visibles uniquement parce que vous avez été invité(e) dessus."
            colorScheme="blue"
          />
        )}
      </div>

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        wishlistSlug={profile.username}
        wishlistName={displayNameFinal}
        visibility="publique"
        isProfile={true}
        isOwnProfile={false}
      />
    </div>
  );
}
