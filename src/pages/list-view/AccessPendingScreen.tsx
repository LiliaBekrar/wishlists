/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/pages/list-view/AccessPendingScreen.tsx
// 🧠 Rôle : Écran pendant que la demande d'accès est en attente


import { BANNER_HEIGHT } from '../../utils/constants';

interface Props {
  BannerComponent: React.ComponentType<any>;
}

export default function AccessPendingScreen({ BannerComponent }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <BannerComponent height={BANNER_HEIGHT.medium} />

      <div className="max-w-2xl mx-auto px-4 py-16 text-center -mt-16 relative z-10">
        <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Demande en attente</h1>
          <p className="text-gray-600 mb-4">
            Ta demande d'accès a été envoyée au propriétaire de la liste.
          </p>
          <p className="text-sm text-gray-500">
            Tu recevras une notification dès qu'elle sera validée.
          </p>
        </div>
      </div>
    </div>
  );
}
