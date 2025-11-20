/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/pages/ProfilePrivate.tsx
// ✨ Profil privé : bannière moderne + header façon ListView + modal d’édition

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useWishlists } from '../hooks/useWishlists';
import { useNavigate } from 'react-router-dom';
import { AVATAR_CONFIG, BANNER_HEIGHT, FOCUS_RING } from '../utils/constants';
import { supabase } from '../lib/supabaseClient';
import ModernBanner from '../components/banners';
import Toast from '../components/Toast';
import ShareModal from '../components/Lists/ShareModal';

export default function ProfilePrivate() {
  const { user } = useAuth();
  const { profile, loading, updateProfile, exportUserData, deleteAccount } = useProfile(user?.id);
  const { wishlists } = useWishlists();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  // --- état principal ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

  const publicWishlists = wishlists.filter((w) => w.visibility === 'publique');
  const displayNameFinal = profile?.display_name || profile?.username || '';
  const currentAvatar = avatarPreview || profile?.avatar_url || null;

  // --- avatar ---

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

    // cast pour éviter l’erreur TS sur includes()
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
      setToast({ message: 'Erreur lors de l’upload de la photo', type: 'error' });
      return null;
    }
  };

  // --- sauvegarde profil ---

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
      // vérifier unicité du username
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

      // upload avatar si besoin
      let newAvatarUrl = profile.avatar_url;
      if (avatarFile) {
        const uploaded = await uploadAvatar();
        if (uploaded) newAvatarUrl = uploaded;
      }

      // maj email auth
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

  // --- export / suppression ---

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

  // --- loading / erreur ---

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

  // --- rendu ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* HEADER style ListView + avatar au centre */}
      <div className="relative overflow-hidden">
        <ModernBanner height={BANNER_HEIGHT.large} />

        {/* Boutons en haut à gauche (retour + partager) */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-30">
          {/* Retour Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className={`p-2 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg transition-all hover:scale-110 ${FOCUS_RING}`}
            aria-label="Retour au dashboard"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Partager profil */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg transition-all hover:scale-105 font-semibold text-gray-700 text-sm ${FOCUS_RING}`}
            aria-label="Partager mon profil"
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

        {/* Bouton modifier en haut à droite */}
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold rounded-full shadow-lg transition-all hover:scale-105 text-sm ${FOCUS_RING}`}
          >
            <span className="text-lg">✏️</span>
            <span className="hidden sm:inline">Modifier mon profil</span>
          </button>
        </div>

        {/* Avatar + nom + tagline centrés */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center text-white max-w-2xl">
            <div className="mb-4 flex justify-center">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Avatar"
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
              🎁 Découvrez mes listes de souhaits : Noël, anniversaires et petites envies à offrir
            </p>
            <p className="text-xs sm:text-sm text-white/80">
              (ou à se faire offrir) ✨
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-4 mt-10 relative z-10 pb-12 space-y-6">
        {/* Cartes stats + infos */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {/* Stats */}
            <div className="flex sm:flex-col items-center justify-center gap-6 sm:gap-4 w-full sm:w-1/3">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 drop-shadow-lg">
                  {profile.total_wishlists}
                </div>
                <div className="text-sm text-gray-600">
                  liste{profile.total_wishlists > 1 ? 's' : ''}
                </div>
              </div>
              <div className="w-px h-12 bg-gray-200 hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 drop-shadow-lg">
                  {profile.total_public_wishlists}
                </div>
                <div className="text-sm text-gray-600">
                  liste publique{profile.total_public_wishlists > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Infos */}
            <div className="flex-1">
              {/* Header : titre + bouton à droite */}
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>👤</span> Mes informations
                </h2>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-all"
                >
                  ✏️ Modifier
                </button>
              </div>

              {/* Contenu */}
              <dl className="space-y-2 text-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <dt className="sm:w-40 font-semibold">Pseudo</dt>
                  <dd>@{profile.username}</dd>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center">
                  <dt className="sm:w-40 font-semibold">Nom d’affichage</dt>
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
          </div>
        </div>

        {/* Listes publiques (toujours affiché, même si 0) */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-3xl">📋</span>
            Mes listes publiques ({publicWishlists.length})
          </h2>

          {publicWishlists.length === 0 ? (
            <p className="text-gray-500 italic">
              Vous n&apos;avez pas encore créé de liste publique.
              <span className="ml-1">Créez-en une dans le Dashboard pour la partager 🎁</span>
            </p>
          ) : (
            <>
              <p className="text-gray-600 mb-4 text-sm">
                Cliquez sur une liste pour la découvrir comme vos invités la verront ✨
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
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>

            <button
              onClick={handleDelete}
              className={`w-full flex items-center justify-between px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all ${FOCUS_RING}`}
            >
              <span>🗑️ Supprimer mon compte</span>
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL ÉDITION – style AddItemModal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setIsEditModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl sm:rounded-2xl shadow-2xl">
            {/* Header gradient */}
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
                Mets à jour ton pseudo, ton nom d’affichage, ta bio, ton email et ta photo.
              </p>
            </div>

            {/* Contenu formulaire */}
            <div className="p-6 sm:p-8 space-y-5">
              {/* Avatar */}
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

              {/* Pseudo */}
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

              {/* Nom d'affichage */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nom d’affichage
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg"
                  disabled={saving}
                />
              </div>

              {/* Bio */}
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

              {/* Email */}
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

              {/* Boutons */}
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

      {/* SHARE MODAL */}
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
