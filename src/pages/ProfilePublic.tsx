/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/pages/ProfilePublic.tsx
// 🧠 Rôle : Page profil publique (lecture seule, même look que ProfilePrivate)

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { BANNER_HEIGHT, FOCUS_RING } from '../utils/constants';
import ModernBanner from '../components/banners';
import ShareModal from '../components/Lists/ShareModal';

export default function ProfilePublic() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [userId, setUserId] = useState<string | null>(null);
  const [publicWishlists, setPublicWishlists] = useState<any[]>([]);
  const [sharedWishlists, setSharedWishlists] = useState<any[]>([]);
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

  // Charger les listes
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
      if (user) {
        const { data: sharedData } = await supabase
          .from('wishlist_members')
          .select(`
            wishlist_id,
            wishlists!inner(*)
          `)
          .eq('user_id', user.id)
          .eq('wishlists.owner_id', userId)
          .eq('status', 'actif');

        setSharedWishlists(sharedData?.map((m: any) => m.wishlists) || []);
      }

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
  const currentAvatar = profile.avatar_url || null;

  const totalWishlists =
    (profile as any).total_wishlists ?? publicWishlists.length;
  const totalPublicWishlists =
    (profile as any).total_public_wishlists ?? publicWishlists.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* HEADER style ProfilePrivate */}
      <div className="relative overflow-hidden">
        <ModernBanner height={BANNER_HEIGHT.large} />

        {/* Boutons en haut à gauche (retour + partager) */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-30">
          {/* Retour */}
          <button
            onClick={() => navigate(-1)}
            className={`p-2 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg transition-all hover:scale-110 ${FOCUS_RING}`}
            aria-label="Retour"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Partager profil */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg transition-all hover:scale-105 font-semibold text-gray-700 text-sm ${FOCUS_RING}`}
            aria-label="Partager ce profil"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span className="hidden sm:inline">Partager</span>
          </button>
        </div>

        {/* Avatar + nom + tagline centrés (lecture seule) */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center text-white max-w-2xl">
            <div className="mb-4 flex justify-center">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={`Avatar de ${displayNameFinal}`}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white shadow-2xl transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(236,72,153,0.6)]"
                />
              ) : (
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white text-5xl sm:text-6xl font-bold border-4 border-white shadow-2xl transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(236,72,153,0.6)]">
                  {displayNameFinal[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold mb-1 drop-shadow-lg">
              {displayNameFinal}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-2">@{profile.username}</p>

            <p className="text-sm sm:text-base text-white/85 mb-1">
              🎁 Découvrez ses listes de souhaits publiques
            </p>
            <p className="text-xs sm:text-sm text-white/80">
              Pour Noël, anniversaires et petites attentions ✨
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-4 mt-10 relative z-10 pb-12 space-y-6">
        {/* Cartes stats + infos (sans email ni actions sensibles) */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {/* Stats */}
            <div className="flex sm:flex-col items-center justify-center gap-6 sm:gap-4 w-full sm:w-1/3">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 drop-shadow-lg">
                  {totalWishlists}
                </div>
                <div className="text-sm text-gray-600">
                  liste{totalWishlists > 1 ? 's' : ''}
                </div>
              </div>
              <div className="w-px h-12 bg-gray-200 hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 drop-shadow-lg">
                  {totalPublicWishlists}
                </div>
                <div className="text-sm text-gray-600">
                  liste publique{totalPublicWishlists > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Infos */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>👤</span> À propos de {displayNameFinal}
                </h2>
              </div>

              <dl className="space-y-2 text-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <dt className="sm:w-40 font-semibold">Pseudo</dt>
                  <dd>@{profile.username}</dd>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center">
                  <dt className="sm:w-40 font-semibold">Nom d’affichage</dt>
                  <dd>{profile.display_name || '—'}</dd>
                </div>

                <div className="flex flex-col sm:flex-row">
                  <dt className="sm:w-40 font-semibold">Bio</dt>
                  <dd className="italic">
                    {profile.bio || "Aucune bio publique n'a encore été définie ✨"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Listes publiques (visibles par tout le monde) */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-3xl">📋</span>
            Ses listes publiques ({publicWishlists.length})
          </h2>

          {publicWishlists.length === 0 ? (
            <p className="text-gray-500 italic">
              Aucune liste publique pour le moment.
            </p>
          ) : (
            <>
              <p className="text-gray-600 mb-4 text-sm">
                Cliquez sur une liste pour la découvrir comme vous la verrez en tant qu&apos;invité ✨
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicWishlists.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => navigate(`/list/${w.slug}`)}
                    className="text-left bg-white rounded-xl shadow-lg border border-gray-100 p-5 hover:shadow-2xl transition-all hover:-translate-y-1 group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                        {w.name}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                        Publique
                      </span>
                    </div>
                    {w.description ? (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{w.description}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mb-3 italic">
                        Aucun descriptif ajouté pour cette liste.
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
                      <span>Voir la liste</span>
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Listes partagées avec l’utilisateur connecté (optionnel) */}
        {sharedWishlists.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-3xl">🤝</span>
              Listes partagées avec vous ({sharedWishlists.length})
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Ces listes sont visibles uniquement parce que vous avez été invité(e) dessus.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedWishlists.map((w) => (
                <button
                  key={w.id}
                  onClick={() => navigate(`/list/${w.slug}`)}
                  className="text-left bg-white rounded-xl shadow-lg border border-gray-100 p-5 hover:shadow-2xl transition-all hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {w.name}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                      Partagée avec vous
                    </span>
                  </div>
                  {w.description ? (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{w.description}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mb-3 italic">
                      Aucun descriptif ajouté pour cette liste.
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                    <span>Voir la liste</span>
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SHARE MODAL (profil public) */}
      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          wishlistSlug={profile.username}
          wishlistName={displayNameFinal}
          visibility="publique"
          isProfile={true}
        />
      )}
    </div>
  );
}
