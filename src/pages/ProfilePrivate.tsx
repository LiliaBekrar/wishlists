/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/pages/ProfilePrivate.tsx
// ✨ Profil privé : utilise les composants modulaires

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useWishlists } from '../hooks/useWishlists';
import { useNavigate } from 'react-router-dom';
import { AVATAR_CONFIG, FOCUS_RING } from '../utils/constants';
import { supabase } from '../lib/supabaseClient';
import Toast from '../components/Toast';
import ShareModal from '../components/Lists/ShareModal';
import ProfileBanner from '../components/Profile/ProfileBanner';
import ProfileWishlists from '../components/Profile/ProfileWishlists';

export default function ProfilePrivate() {
  const { user } = useAuth();
  const { profile, loading, updateProfile, exportUserData, deleteAccount } = useProfile(user?.id);
  const { wishlists } = useWishlists();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [wishlistsWithCounts, setWishlistsWithCounts] = useState<Map<string, number>>(new Map());

  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setUsername(profile.username || '');
    }
    if (user?.email) {
      setEmail(user.email);
    }
  }, [profile, user]);

  useEffect(() => {
    const fetchItemCounts = async () => {
      const counts = new Map<string, number>();
      for (const wishlist of wishlists) {
        const { count } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('wishlist_id', wishlist.id);
        counts.set(wishlist.id, count || 0);
      }
      setWishlistsWithCounts(counts);
    };

    if (wishlists.length > 0) {
      fetchItemCounts();
    }
  }, [wishlists]);

  const publicWishlists = wishlists.filter((w) => w.visibility === 'publique');
  const displayNameFinal = profile?.display_name || profile?.username || '';
  const currentAvatar = avatarPreview || profile?.avatar_url || null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > AVATAR_CONFIG.MAX_SIZE_BYTES) {
      setToast({
        message: `❌ Image trop lourde (max ${AVATAR_CONFIG.MAX_SIZE_MB}MB)`,
        type: 'error',
      });
      return;
    }

    if (!AVATAR_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
      setToast({ message: '❌ Format non supporté', type: 'error' });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    try {
      const ext = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_CONFIG.BUCKET_NAME)
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(AVATAR_CONFIG.BUCKET_NAME)
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error('❌ Upload avatar:', err);
      setToast({ message: 'Erreur lors de l\'upload de la photo', type: 'error' });
      return null;
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !user) return;

    setSaving(true);
    setUsernameError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setUsernameError('Le pseudo est obligatoire');
      setSaving(false);
      return;
    }

    try {
      if (cleanUsername !== profile.username) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanUsername)
          .neq('id', user.id)
          .maybeSingle();

        if (existing) {
          setUsernameError('Ce pseudo est déjà pris');
          setSaving(false);
          return;
        }
      }

      let newAvatarUrl = profile.avatar_url;
      if (avatarFile) {
        const uploaded = await uploadAvatar();
        if (uploaded) newAvatarUrl = uploaded;
      }

      if (email !== user.email) {
        await supabase.auth.updateUser({ email });
      }

      await updateProfile({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        username: cleanUsername,
        avatar_url: newAvatarUrl,
      });

      setToast({ message: '✅ Profil mis à jour !', type: 'success' });
      setIsEditModalOpen(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      console.error('❌ Erreur sauvegarde profil:', err);
      setToast({ message: '❌ Erreur lors de la sauvegarde', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportUserData();
      setToast({ message: '✅ Export téléchargé !', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: '❌ Erreur export', type: 'error' });
    }
  };

  const handleDelete = async () => {
    const confirmText = window.prompt(
      '⚠️ ATTENTION : Tape "SUPPRIMER" pour confirmer la suppression définitive de ton compte.'
    );

    if (confirmText !== 'SUPPRIMER') {
      setToast({ message: 'Suppression annulée', type: 'success' });
      return;
    }

    try {
      await deleteAccount();
      setToast({ message: '👋 Compte supprimé', type: 'success' });
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err);
      setToast({ message: '❌ Erreur suppression', type: 'error' });
    }
  };

  if (loading) {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profil introuvable</h1>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* HEADER avec ProfileBanner */}
      <ProfileBanner
        displayName={displayNameFinal}
        username={profile.username}
        bio={profile.bio}
        avatarUrl={currentAvatar}
        stats={[
          { value: profile.total_wishlists, label: profile.total_wishlists > 1 ? 'Listes' : 'Liste' },
          { value: profile.total_public_wishlists, label: profile.total_public_wishlists > 1 ? 'Publiques' : 'Publique' }
        ]}
        tagline="Partagez vos envies avec ceux qui comptent !"
        isPrivate={true}
        onBack={() => navigate('/dashboard')}
        onShare={() => setIsShareModalOpen(true)}
        onEdit={() => setIsEditModalOpen(true)}
        onViewPublicProfile={() => navigate(`/profile/${profile.username}`)}
      />

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-4 mt-10 relative z-10 pb-12 space-y-8">
        {/* Section infos */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>👤</span> Mes informations
            </h2>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-all ${FOCUS_RING}`}
            >
              ✏️ Modifier
            </button>
          </div>

          <dl className="space-y-2 text-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <dt className="sm:w-40 font-semibold">Pseudo</dt>
              <dd>@{profile.username}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <dt className="sm:w-40 font-semibold">Nom d'affichage</dt>
              <dd>{profile.display_name || '—'}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <dt className="sm:w-40 font-semibold">Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div className="flex flex-col sm:flex-row">
              <dt className="sm:w-40 font-semibold">Bio</dt>
              <dd className="italic">
                {profile.bio || "Vous n'avez pas encore défini de bio ✨"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Listes publiques avec ProfileWishlists */}
        <ProfileWishlists
          title="Mes listes publiques"
          icon="🌍"
          wishlists={publicWishlists}
          wishlistsWithCounts={wishlistsWithCounts}
          emptyMessage="Vous n'avez pas encore créé de liste publique."
          emptySubtitle="Créez-en une dans le Dashboard pour la partager 🎁"
          description="Cliquez sur une liste pour la découvrir comme vos invités la verront ✨"
          colorScheme="purple"
        />

        {/* Danger zone */}
        <div className="bg-red-50/50 backdrop-blur-xl rounded-2xl border-2 border-red-200 p-6">
          <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
            <span>⚠️</span> Zone dangereuse
          </h3>
          <p className="text-sm text-red-600 mb-4">
            Actions sensibles sur ton compte. À utiliser avec précaution.
          </p>
          <div className="space-y-2">
            <button
              onClick={handleExport}
              className={`w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-all ${FOCUS_RING}`}
            >
              <span className="font-semibold text-gray-900">📦 Exporter mes données</span>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            <button
              onClick={handleDelete}
              className={`w-full flex items-center justify-between px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all ${FOCUS_RING}`}
            >
              <span>🗑️ Supprimer mon compte</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL ÉDITION */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setIsEditModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl sm:rounded-2xl shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl sm:rounded-t-2xl z-10">
              <button
                onClick={() => !saving && setIsEditModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-2xl font-bold">✏️ Modifier mon profil</h2>
              <p className="text-sm opacity-90 mt-1">
                Mets à jour ton pseudo, ton nom d'affichage, ta bio, ton email et ta photo.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-6 mb-4 pb-4 border-b">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                    {displayNameFinal[0]?.toUpperCase()}
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl"
                    disabled={saving}
                  >
                    📷 Changer la photo
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Max {AVATAR_CONFIG.MAX_SIZE_MB}MB • JPG, PNG, GIF, WebP
                  </p>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Pseudo / username <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">@</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`flex-1 px-3 py-2 border-2 rounded-lg ${
                      usernameError ? 'border-red-400' : 'border-gray-200'
                    }`}
                    disabled={saving}
                  />
                </div>
                {usernameError && (
                  <p className="text-xs text-red-600 mt-1">{usernameError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Utilisé pour ton lien public : /profile/{username || 'mon-pseudo'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nom d'affichage
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg resize-none"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email de connexion
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg"
                  disabled={saving}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => !saving && setIsEditModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all disabled:opacity-50"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? '💾 Enregistrement...' : '✅ Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        wishlistSlug={profile.username}
        wishlistName={displayNameFinal}
        visibility="publique"
        isProfile={true}
        isOwnProfile={true}
      />
    </div>
  );
}
