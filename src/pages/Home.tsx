// 📄 Home.tsx
// 🧠 Rôle : Landing page moderne avec glassmorphism
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ModernBanner from '../components/banners';
import Toast from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { APP_NAME, FOCUS_RING, BANNER_HEIGHT, APP_TAGLINE } from '../utils/constants';

export default function Home() {
  const [searchParams] = useSearchParams();
  const showLogin = searchParams.get('login') === 'true';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const navigate = useNavigate();
  const { user, signInWithEmail } = useAuth();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 Début handleSubmit, email:', email);
    setLoading(true);

    try {
      console.log('🔵 Appel signInWithEmail...');
      const result = await signInWithEmail(email);
      console.log('🔵 Résultat:', result);

      setLoading(false);

      if (result?.error) {
        console.error('❌ Erreur:', result.error);
        setToast({
          message: `Erreur : ${result.error.message || 'Erreur inconnue'}`,
          type: 'error'
        });
      } else {
        console.log('✅ Magic link envoyé avec succès');
        setToast({
          message: '✉️ Magic link envoyé ! Vérifie ta boîte mail.',
          type: 'success'
        });
        setEmail('');
      }
    } catch (err) {
      console.error('❌ Exception:', err);
      setLoading(false);
      setToast({
        message: 'Une erreur est survenue. Réessaie.',
        type: 'error'
      });
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

      {/* Bannière moderne */}
      <div className="relative overflow-hidden">
        <ModernBanner height={BANNER_HEIGHT.large} />

        {/* Overlay content sur la bannière */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-lg">
              {APP_NAME}
            </h1>
            <p className="text-xl md:text-2xl font-light opacity-95 drop-shadow">
              {APP_TAGLINE}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">

        {/* Card principale avec glassmorphism */}
        <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 mb-12">

          {showLogin ? (
            /* Modal de connexion */
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
                Connexion
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Reçois un lien magique par e-mail
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                    className={`w-full px-4 py-3 bg-white/50 backdrop-blur border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-blue-300`}
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all ${FOCUS_RING}`}
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
                    '✉️ Envoyer le lien magique'
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">
                    Pas de mot de passe • Connexion sécurisée en 1 clic
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    ← Retour à l'accueil
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Hero content */
            <>
              {/* Features cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  {
                    icon: '🎁',
                    title: 'Listes thématiques',
                    desc: 'Crée des listes pour toutes les occasions',
                    gradient: 'from-violet-500 to-purple-500'
                  },
                  {
                    icon: '🔒',
                    title: 'Réservations privées',
                    desc: 'Tes proches réservent en toute discrétion',
                    gradient: 'from-blue-500 to-cyan-500'
                  },
                  {
                    icon: '💰',
                    title: 'Budget intelligent',
                    desc: 'Gère tes dépenses avec des budgets visuels',
                    gradient: 'from-pink-500 to-rose-500'
                  }
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="group relative bg-white/60 backdrop-blur rounded-2xl p-6 border border-gray-200/50 hover:border-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`}></div>
                    <div className="relative">
                      <div className="text-5xl mb-4">{feature.icon}</div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600 text-sm">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center">
                <button
                  onClick={() => navigate('/?login=true')}
                  className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-semibold px-10 py-5 rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105 ${FOCUS_RING}`}
                >
                  <span>🚀 Commencer gratuitement</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <p className="mt-6 text-gray-500 text-sm">
                  Gratuit • Sans carte bancaire • Connexion instantanée
                </p>
              </div>
            </>
          )}
        </div>

        {/* Section "Comment ça marche" */}
        <div className="pb-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Simple, rapide, efficace
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Crée', desc: 'Tes listes de cadeaux', color: 'from-violet-500 to-purple-500' },
              { step: '2', title: 'Partage', desc: 'Par e-mail ou lien direct', color: 'from-blue-500 to-cyan-500' },
              { step: '3', title: 'Réserve', desc: 'Anonymement sans doublons', color: 'from-pink-500 to-rose-500' },
              { step: '4', title: 'Visualise', desc: 'Garde en vue ton budget !', color: 'from-amber-500 to-orange-500' }
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className={`relative w-20 h-20 mx-auto mb-6`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl rotate-6 group-hover:rotate-12 transition-transform`}></div>
                  <div className={`relative bg-gradient-to-br ${item.color} rounded-2xl w-full h-full flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
