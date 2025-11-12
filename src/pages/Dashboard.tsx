/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 Dashboard.tsx
// 🧠 Rôle : Dashboard utilisateur mobile-first avec modal création
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FOCUS_RING } from '../utils/constants';
import CreateListModal from '../components/CreateListModal';

export default function Dashboard() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateList = async (data: any) => {
    console.log('✅ Données de la liste:', data);
    // TODO: Appel Supabase
    // const { data: newList, error } = await supabase
    //   .from('wishlists')
    //   .insert({
    //     name: data.name,
    //     description: data.description,
    //     theme: data.theme,
    //     visibility: data.visibility,
    //     owner_id: user.id
    //   })
    //   .select()
    //   .single();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Header responsive */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Bonjour {user?.pseudo || user?.email?.split('@')[0]} !
            </span>
            <span className="ml-2">👋</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Prêt à organiser tes cadeaux ?
          </p>
        </div>

        {/* Empty state responsive */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-white/20 p-6 sm:p-8 md:p-12">
          <div className="max-w-2xl mx-auto text-center">

            {/* Illustration SVG - plus petite sur mobile */}
            <div className="mb-6 sm:mb-8">
              <svg className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="60" y="80" width="80" height="70" fill="url(#giftGrad)" rx="4"/>
                <rect x="60" y="80" width="80" height="12" fill="#ec4899"/>
                <rect x="96" y="60" width="8" height="90" fill="#ec4899"/>
                <ellipse cx="85" cy="65" rx="12" ry="8" fill="#f43f5e"/>
                <ellipse cx="115" cy="65" rx="12" ry="8" fill="#f43f5e"/>
                <circle cx="100" cy="60" r="6" fill="#be123c"/>
                <circle cx="40" cy="60" r="3" fill="#fbbf24" opacity="0.8"/>
                <circle cx="160" cy="100" r="4" fill="#60a5fa" opacity="0.8"/>
                <circle cx="50" cy="130" r="2" fill="#a855f7" opacity="0.8"/>
                <circle cx="150" cy="70" r="3" fill="#ec4899" opacity="0.8"/>
                <defs>
                  <linearGradient id="giftGrad" x1="60" y1="80" x2="140" y2="150">
                    <stop offset="0%" stopColor="#7c3aed"/>
                    <stop offset="100%" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Texte responsive */}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Ta première liste t'attend ! 🎁
            </h2>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-relaxed px-2">
              Crée une liste pour <strong>Noël</strong>, un <strong>anniversaire</strong>,
              une <strong>naissance</strong> ou un <strong>mariage</strong>.
              Ajoute tes envies, partage avec tes proches et évite les doublons !
            </p>

            {/* CTA Button responsive avec onClick */}
            <button
              onClick={() => setIsModalOpen(true)}
              className={`group relative inline-flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white text-base sm:text-lg font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105 ${FOCUS_RING}`}
            >
              <span className="relative z-10">➕ Créer ma première liste</span>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            </button>

            {/* Features grid responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
              {[
                { icon: '⚡', title: 'Rapide', desc: 'Crée une liste en 2 minutes' },
                { icon: '🔒', title: 'Privé', desc: 'Partage avec tes proches' },
                { icon: '💰', title: 'Budget', desc: 'Gère tes dépenses' }
              ].map((feature, i) => (
                <div key={i} className="group bg-gradient-to-br from-white/50 to-white/30 backdrop-blur rounded-xl p-4 sm:p-6 border border-gray-200/50 hover:border-purple-300 hover:shadow-lg transition-all">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tips section responsive - stack sur mobile */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-100">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="text-3xl sm:text-4xl flex-shrink-0">💡</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Astuce du jour</h3>
                <p className="text-gray-700 text-xs sm:text-sm">
                  Tu peux ajouter des liens Amazon, Fnac, etc. L'app récupérera automatiquement
                  le titre, l'image et le prix ! ✨
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-100">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="text-3xl sm:text-4xl flex-shrink-0">🎯</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Prochainement</h3>
                <p className="text-gray-700 text-xs sm:text-sm">
                  Extension navigateur pour ajouter un cadeau en 1 clic depuis n'importe quel site ! 🚀
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal création liste */}
      <CreateListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateList}
      />
    </div>
  );
}
