// 📄 src/pages/ProfilePrivate.tsx
// 🧠 Rôle : Page profil privée (éditable par l'utilisateur)

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useWishlists } from '../hooks/useWishlists';
import { useNavigate } from 'react-router-dom';
import { FOCUS_RING } from '../utils/constants';
import Toast from '../components/Toast';
import { supabase } from '../lib/supabaseClient';

export default function ProfilePrivate() {
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile(user?.id);
  const { wishlists } = useWishlists();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');

  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleEdit = () => {
    setDisplayName(profile?.display_name || '');
    setBio(profile?.bio || '');
    setUsername(profile?.username || (user?.email ? user.email.split('@')[0] : ''));
    setEmail(user?.email ?? '');
    setUsernameError(null);
    setEmailError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    setSaving(true);
    setUsernameError(null);
    setEmailError(null);

    const cleanDisplayName = displayName.trim();
    const cleanBio = bio.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    try {
      // 👉 Validation de base
      if (!cleanUsername) {
        setUsernameError('Le pseudo est obligatoire.');
        setSaving(false);
        return;
      }

      // 👉 Vérifier unicité du username (si modifié)
      if (cleanUsername !== profile.username) {
        const { data: existing, error: usernameCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanUsername)
          .neq('id', user.id)
          .maybeSingle();

        // Si erreur autre que "no rows", on log mais on laisse continuer (optionnel)
        if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
          console.error('Erreur vérif username:', usernameCheckError);
        }

        if (existing) {
          setUsernameError('Ce pseudo est déjà pris. Essaie avec une autre variante 😊');
          setSaving(false);
          return;
        }
      }

      // 👉 Mise à jour de l'email d'auth (si modifié)
      if (cleanEmail && cleanEmail !== user.email) {
        const { error: emailUpdateError } = await supabase.auth.updateUser({
          email: cleanEmail,
        });

        if (emailUpdateError) {
          console.error('Erreur update email:', emailUpdateError);
          setEmailError(emailUpdateError.message || 'Impossible de mettre à jour l’email pour le moment.');
          setSaving(false);
          return;
        }
      }

      // 👉 Mise à jour du profil (display_name, bio, username)
      await updateProfile({
        display_name: cleanDisplayName || null,
        bio: cleanBio || null,
        username: cleanUsername,
      });

      setToast({ message: '✅ Profil mis à jour !', type: 'success' });
      setEditing(false);
    } catch (error) {
      console.error('❌ Erreur:', error);
      setToast({ message: '❌ Erreur lors de la sauvegarde', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyProfileLink = () => {
    if (!profile?.username) return;
    const profileUrl = `${window.location.origin}/profile/${profile.username}`;
    navigator.clipboard.writeText(profileUrl);
    setToast({ message: '✅ Lien copié dans le presse-papiers', type: 'success' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <p>Profil introuvable</p>
      </div>
    );
  }

  const publicWishlists = wishlists.filter((w) => w.visibility === 'publique');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className={`inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 font-medium ${FOCUS_RING} px-2 py-1 rounded-lg`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm sm:text-base">Retour au tableau de bord</span>
          </button>

          <button
            onClick={signOut}
            className={`text-red-600 hover:text-red-700 font-medium text-sm sm:text-base ${FOCUS_RING} px-3 py-2 rounded-lg`}
          >
            Déconnexion
          </button>
        </div>

        {/* Bloc profil + compte */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-5 sm:p-8 space-y-6">
          {/* Avatar + titre */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="self-center sm:self-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-lg">
              {(profile.display_name || profile.username)[0].toUpperCase()}
            </div>

            <div className="flex-1 space-y-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-sm sm:text-base text-gray-500">
                Profil privé · Ce que vous modifiez ici impacte votre profil public et vos infos de compte.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-purple-50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                {profile.total_wishlists}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Liste{profile.total_wishlists > 1 ? 's' : ''} totale
                {profile.total_wishlists > 1 ? 's' : ''}
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                {profile.total_public_wishlists}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Liste{profile.total_public_wishlists > 1 ? 's' : ''} publique
                {profile.total_public_wishlists > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Sections éditables */}
          <div className="space-y-5">
            {/* Section profil public */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Profil public</h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Ces informations sont visibles sur votre page publique et dans le lien de profil.
                  </p>
                </div>

                {!editing && (
                  <button
                    onClick={handleEdit}
                    className={`text-sm sm:text-base bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-2 rounded-xl ${FOCUS_RING}`}
                  >
                    ✏️ Modifier
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  {/* Username */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Pseudo / username <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 hidden sm:block">profile/</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="ex : liliabekrar"
                        className={`flex-1 px-3 py-2 bg-white border-2 rounded-lg text-sm sm:text-base ${
                          usernameError ? 'border-red-400' : 'border-gray-200'
                        } ${FOCUS_RING}`}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Utilisé dans l’URL publique : <span className="font-mono">/profile/{username || 'mon-pseudo'}</span>.
                      Il doit être unique.
                    </p>
                    {usernameError && (
                      <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                    )}
                  </div>

                  {/* Display name */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Nom d’affichage
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nom visible sur le profil"
                      className={`w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm sm:text-base ${FOCUS_RING}`}
                    />
                    <p className="text-xs text-gray-500">
                      Ce nom est affiché en gros sur votre profil public. Si vide, on utilisera votre pseudo.
                    </p>
                  </div>

                  {/* Bio */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Bio (optionnelle)
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Quelques mots sur vous, vos goûts, le type de cadeaux que vous aimez..."
                      rows={3}
                      className={`w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm sm:text-base ${FOCUS_RING}`}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-500">Pseudo / username :</span>
                    <span className="font-mono text-gray-900">@{profile.username}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-500">Nom d’affichage :</span>
                    <span className="font-semibold text-gray-900">
                      {profile.display_name || profile.username}
                    </span>
                  </div>
                  {profile.bio && (
                    <p className="text-gray-700 mt-1">{profile.bio}</p>
                  )}
                  <button
                    onClick={handleCopyProfileLink}
                    className={`mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium ${FOCUS_RING} px-2 py-1 rounded-lg`}
                  >
                    🔗 Copier le lien public
                  </button>
                </div>
              )}
            </section>

            {/* Section compte */}
            <section className="pt-4 border-t border-gray-100 space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Compte</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Ces informations sont utilisées pour la connexion et les emails de notifications.
              </p>

              {editing ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Email de connexion
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3 py-2 bg-white border-2 rounded-lg text-sm sm:text-base ${
                        emailError ? 'border-red-400' : 'border-gray-200'
                      } ${FOCUS_RING}`}
                    />
                    <p className="text-xs text-gray-500">
                      Sert à vous connecter et à recevoir les liens magiques. Un email de confirmation peut être envoyé en cas de changement.
                    </p>
                    {emailError && (
                      <p className="text-xs text-red-500 mt-1">{emailError}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-500">Email :</span>
                    <span className="font-mono text-gray-900">{user?.email}</span>
                  </div>
                </div>
              )}
            </section>

            {/* Boutons actions globales */}
            {editing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm sm:text-base ${FOCUS_RING}`}
                >
                  {saving ? 'Enregistrement…' : '✅ Enregistrer les modifications'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className={`px-4 sm:px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl text-sm sm:text-base ${FOCUS_RING}`}
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Listes publiques */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900">
            Mes listes publiques ({publicWishlists.length})
          </h2>

          {publicWishlists.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 text-center text-sm sm:text-base">
              <p className="text-gray-600">
                Aucune liste publique pour le moment.
                Tu peux rendre une liste publique depuis son écran de détail pour qu’elle apparaisse ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {publicWishlists.map((wishlist) => (
                <button
                  key={wishlist.id}
                  onClick={() => navigate(`/list/${wishlist.slug}`)}
                  className="w-full text-left bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 p-4 sm:p-5 hover:shadow-2xl transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1">
                      {wishlist.name}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Publique
                    </span>
                  </div>
                  {wishlist.description && (
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                      {wishlist.description}
                    </p>
                  )}
                  <p className="mt-3 text-xs sm:text-sm text-purple-600 font-medium">
                    Voir la liste →
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
