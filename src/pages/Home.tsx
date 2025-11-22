// 📄 Home.tsx
// 🧠 Rôle : Landing page SEO-friendly responsive mobile-first
// 💬 Concept : Wishlist intelligente — partage, réservation et budget automatisé

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ModernBanner from '../components/banners';
import Toast from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { APP_NAME, FOCUS_RING, BANNER_HEIGHT, APP_TAGLINE } from '../utils/constants';

type ToastState = { message: string; type: 'success' | 'error' } | null;

export default function Home() {
  const [searchParams] = useSearchParams();
  const showLogin = searchParams.get('login') === 'true';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const navigate = useNavigate();
  const { user, signInWithEmail } = useAuth();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signInWithEmail(email);
      setLoading(false);

      if (result && result.error) {
        const msg = result.error instanceof Error ? result.error.message : 'Erreur inconnue';
        setToast({ message: `Erreur : ${msg}`, type: 'error' });
      } else {
        setToast({ message: '✉️ Magic link envoyé ! Vérifie ta boîte mail ET tes spams 📬', type: 'success' });
        setEmail('');
      }
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.';
      setToast({ message: msg, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Bannière responsive */}
      <div className="relative overflow-hidden">
        <ModernBanner height={BANNER_HEIGHT.medium} className="sm:h-[300px] md:h-[350px]" />

        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center text-white">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-4 drop-shadow-lg">
              {APP_NAME}
            </h1>

            <p className="text-base sm:text-lg md:text-xl font-semibold opacity-95 drop-shadow mb-2 sm:mb-3">
              {APP_TAGLINE}
            </p>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-light opacity-85 drop-shadow px-2 pb-6 sm:pb-4 mb-3">
              Ta wishlist intelligente — partage, réservation et budget maîtrisé 🎁
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 md:-mt-24 relative z-10">
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-white/20 p-6 sm:p-8 md:p-12 mb-8 sm:mb-12">

          {showLogin ? (
            /* --- Section Connexion --- */
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
                Connexion à WishLists
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8 px-2">
                Reçois un lien magique par e-mail et accède à tes listes instantanément
              </p>

              {/* ⬅️ NOUVEAU : Avertissement SMTP/Spam */}
              <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900 text-sm mb-1">
                      ⚠️ Vérifie tes spams !
                    </h3>
                    <p className="text-amber-800 text-xs leading-relaxed">
                      L'e-mail peut arriver dans tes <strong>spams ou promotions</strong> car nous n'avons pas encore de serveur SMTP professionnel. Pense à vérifier ces dossiers ! 📬
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse e-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="exemple@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 text-base bg-white/50 backdrop-blur border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-blue-300`}
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all ${FOCUS_RING}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Envoi...
                    </span>
                  ) : (
                    '✉️ Recevoir le lien magique'
                  )}
                </button>

                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-500 mb-4">
                    Pas de mot de passe, pas de tracas — une connexion sécurisée en un clic.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    ← Retour à l&apos;accueil
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* --- Section Hero --- */
            <>
              {/* Avantages clés */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
                {[
                  {
                    icon: '🎁',
                    title: 'Wishlist collaborative',
                    desc: 'Partage tes envies et invite tes proches à réserver sans doublons.',
                    gradient: 'from-violet-500 to-purple-500',
                  },
                  {
                    icon: '💰',
                    title: 'Budget automatique',
                    desc: 'Chaque réservation met à jour ton budget sans calcul manuel.',
                    gradient: 'from-blue-500 to-cyan-500',
                  },
                  {
                    icon: '✨',
                    title: 'Simple, fluide, rapide',
                    desc: 'Pas de mot de passe, pas de prise de tête — juste du plaisir à offrir.',
                    gradient: 'from-pink-500 to-rose-500',
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="group relative bg-white/60 backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200/50 hover:border-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-xl sm:rounded-2xl transition-opacity`} />
                    <div className="relative">
                      <div className="mb-3 sm:mb-4 grid place-items-center">
                        <span className="text-4xl sm:text-5xl leading-none" aria-hidden>
                          {feature.icon}
                        </span>
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1 sm:mb-2">{feature.title}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center">
                <button
                  onClick={() => navigate('/?login=true')}
                  className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-base sm:text-lg font-semibold px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105 ${FOCUS_RING}`}
                >
                  <span>🚀 Créer ma wishlist</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <p className="mt-4 sm:mt-6 text-gray-500 text-xs sm:text-sm px-4">
                  Gratuit • Sans carte bancaire • Synchronisé automatiquement avec ton budget
                </p>
              </div>
            </>
          )}
        </div>

        {/* Section "Comment ça marche" */}
        <div className="pb-12 sm:pb-16 md:pb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 mb-2 sm:mb-4 px-4">
            Comment ça marche ?
          </h2>
          <p className="text-center text-gray-600 mb-8 sm:mb-12 text-base sm:text-lg px-4">
            En 4 étapes simples pour une organisation parfaite
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              { step: '1', title: 'Crée ta liste', desc: 'Ajoute tes envies pour Noël, anniversaire ou toute occasion.', color: 'from-violet-500 to-purple-500' },
              { step: '2', title: 'Partage-la', desc: 'Envoie le lien à tes proches ou invite-les par e-mail.', color: 'from-blue-500 to-cyan-500' },
              { step: '3', title: 'Ils réservent', desc: 'Chaque cadeau réservé disparaît pour éviter les doublons.', color: 'from-pink-500 to-rose-500' },
              { step: '4', title: 'Ton budget s\'ajuste', desc: 'Le montant réservé est automatiquement comptabilisé.', color: 'from-amber-500 to-orange-500' },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-xl sm:rounded-2xl rotate-6 group-hover:rotate-12 transition-transform`} />
                  <div className={`relative bg-gradient-to-br ${item.color} rounded-xl sm:rounded-2xl w-full h-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg`}>
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm sm:text-base px-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
