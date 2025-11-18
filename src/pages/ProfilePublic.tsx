/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/pages/ProfilePublic.tsx
// 🧠 Rôle : Page profil publique (lecture seule)

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { FOCUS_RING } from '../utils/constants';

export default function ProfilePublic() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [userId, setUserId] = useState<string | null>(null);
  const [publicWishlists, setPublicWishlists] = useState<any[]>([]);
  const [sharedWishlists, setSharedWishlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { profile } = useProfile(userId || undefined);

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
        setLoading(false);
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

      // Listes partagées avec moi
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

      setLoading(false);
    };

    if (userId) {
      fetchWishlists();
    }
  }, [userId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full" />
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
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl"
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-gray-600 hover:text-purple-600 font-medium ${FOCUS_RING} p-2 rounded-lg mb-8`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>

        {/* Card Profil */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {(profile.display_name || profile.username)[0].toUpperCase()}
            </div>

            {/* Infos */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-gray-500 mb-3">@{profile.username}</p>
              {profile.bio && <p className="text-gray-700">{profile.bio}</p>}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{publicWishlists.length}</div>
              <div className="text-sm text-gray-600">Liste{publicWishlists.length > 1 ? 's' : ''} publique{publicWishlists.length > 1 ? 's' : ''}</div>
            </div>
            {sharedWishlists.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{sharedWishlists.length}</div>
                <div className="text-sm text-gray-600">Partagée{sharedWishlists.length > 1 ? 's' : ''} avec moi</div>
              </div>
            )}
          </div>
        </div>

        {/* Listes publiques */}
        {publicWishlists.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Listes publiques ({publicWishlists.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicWishlists.map((wishlist) => (
                <div
                  key={wishlist.id}
                  onClick={() => navigate(`/list/${wishlist.slug}`)}
                  className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 p-6 cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{wishlist.name}</h3>
                  {wishlist.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{wishlist.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listes partagées */}
        {sharedWishlists.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Partagées avec moi ({sharedWishlists.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sharedWishlists.map((wishlist) => (
                <div
                  key={wishlist.id}
                  onClick={() => navigate(`/list/${wishlist.slug}`)}
                  className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 p-6 cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{wishlist.name}</h3>
                  {wishlist.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{wishlist.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
