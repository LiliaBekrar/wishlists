/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/pages/list-view/AccessDeniedScreen.tsx
// 🧠 Rôle : Écran quand l'utilisateur n'a pas accès à la liste

import { useNavigate } from 'react-router-dom';
import { FOCUS_RING, BANNER_HEIGHT } from '../../utils/constants';
import type { Wishlist } from '../../hooks/useWishlists';

interface Props {
  wishlist: Wishlist;
  isLoggedIn: boolean;
  onRequestAccess: () => Promise<void>;
  requestSending: boolean;
  BannerComponent: React.ComponentType<any>;
}

export default function AccessDeniedScreen({
  wishlist,
  isLoggedIn,
  onRequestAccess,
  requestSending,
  BannerComponent,
}: Props) {
  const navigate = useNavigate();

  // ⬅️ CAS 1 : Pas connecté + liste privée → tu ne peux rien faire, il faut se connecter
  if (!isLoggedIn && wishlist.visibility === 'privée') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <BannerComponent height={BANNER_HEIGHT.medium} />

        <div className="max-w-2xl mx-auto px-4 py-16 text-center -mt-16 relative z-10">
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-8">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Liste privée</h1>
            <p className="text-gray-600 mb-6">
              Cette liste est privée. Tu dois être connecté et avoir une invitation pour y accéder.
            </p>
            <button
              onClick={() => navigate('/?login=true')}
              className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all ${FOCUS_RING}`}
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ⬅️ CAS 2 : Pas connecté + liste partagée → se connecter pour DEMANDER l'accès
  if (!isLoggedIn && wishlist.visibility === 'partagée') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <BannerComponent height={BANNER_HEIGHT.medium} />

        <div className="max-w-2xl mx-auto px-4 py-16 text-center -mt-16 relative z-10">
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-8">
            <div className="text-6xl mb-4">🔗</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {wishlist.name}
            </h1>
            <p className="text-gray-600 mb-6">
              Cette liste est partagée. Tu dois <strong>te connecter</strong> pour pouvoir demander l&apos;accès au propriétaire.
            </p>
            <button
              onClick={() => navigate('/?login=true')}
              className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all ${FOCUS_RING}`}
            >
              Se connecter pour demander l&apos;accès
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ⬅️ (optionnel) CAS 3 : Pas connecté + publique (théoriquement tu ne devrais pas arriver ici)
  if (!isLoggedIn && wishlist.visibility === 'publique') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <BannerComponent height={BANNER_HEIGHT.medium} />

        <div className="max-w-2xl mx-auto px-4 py-16 text-center -mt-16 relative z-10">
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-8">
            <div className="text-6xl mb-4">🌍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {wishlist.name}
            </h1>
            <p className="text-gray-600 mb-6">
              Cette liste est publique. Tu peux normalement la consulter. Si tu vois cet écran,
              essaie de te connecter pour continuer.
            </p>
            <button
              onClick={() => navigate('/?login=true')}
              className={`bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-all ${FOCUS_RING}`}
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ⬅️ CAS 4 : Connecté mais pas membre → bouton "Demander l'accès"
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <BannerComponent height={BANNER_HEIGHT.medium} />

      <div className="max-w-2xl mx-auto px-4 py-16 text-center -mt-16 relative z-10">
        <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-6xl mb-4">
            {wishlist.visibility === 'privée' ? '🔒' : '🔗'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {wishlist.name}
          </h1>
          <p className="text-gray-600 mb-6">
            {wishlist.visibility === 'privée'
              ? 'Cette liste est privée. Demande l\'accès au propriétaire.'
              : 'Demande à rejoindre cette liste pour pouvoir réserver des cadeaux.'}
          </p>
          <button
            onClick={onRequestAccess}
            disabled={requestSending}
            className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all ${FOCUS_RING} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {requestSending ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Envoi en cours...</span>
              </div>
            ) : (
              'Demander l\'accès'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
