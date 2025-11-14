/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/pages/list-view/ListViewHeader.tsx
// 🧠 Rôle : Header avec bannière, titre et boutons (+ gérer membres + quitter)

import { BANNER_HEIGHT } from '../../utils/constants';
import type { Wishlist } from '../../hooks/useWishlists';

interface Props {
  wishlist: Wishlist;
  isOwner: boolean;
  isMember: boolean;
  onBack: () => void;
  onShare: () => void;
  onManageMembers: () => void;
  onLeaveList: () => void;
  BannerComponent: React.ComponentType<any>;
}

export default function ListViewHeader({
  wishlist,
  isOwner,
  isMember,
  onBack,
  onShare,
  onManageMembers,
  onLeaveList,
  BannerComponent,
}: Props) {
  return (
    <div className="relative overflow-hidden">
      <BannerComponent height={BANNER_HEIGHT.medium} />

      {/* Titre centré */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="text-center text-white max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">
            {wishlist.name}
          </h1>
          {wishlist.description && (
            <p className="text-base sm:text-lg opacity-95 drop-shadow">
              {wishlist.description}
            </p>
          )}
        </div>
      </div>

      {/* Badge visibilité */}
      <div className="absolute top-4 right-4">
        <span className="px-3 py-1.5 bg-white/90 backdrop-blur text-sm font-medium rounded-full text-gray-700 shadow-md">
          {wishlist.visibility === 'privée' && '🔒 Privée'}
          {wishlist.visibility === 'partagée' && '🔗 Partagée'}
          {wishlist.visibility === 'publique' && '🌍 Publique'}
        </span>
      </div>

      {/* Boutons en haut à gauche */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        {/* Bouton retour */}
        <button
          onClick={onBack}
          className="p-2 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg transition-all hover:scale-110"
          aria-label="Retour"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Bouton partager */}
        <button
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg transition-all hover:scale-105 font-semibold text-gray-700"
          aria-label="Partager"
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

        {/* Bouton gérer membres (owner uniquement) */}
        {isOwner && (
          <button
            onClick={onManageMembers}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg transition-all hover:scale-105 font-semibold text-gray-700"
            aria-label="Gérer les membres"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="hidden sm:inline">Membres</span>
          </button>
        )}

        {/* Bouton quitter (membre non-owner uniquement) */}
        {!isOwner && isMember && (
          <button
            onClick={onLeaveList}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 backdrop-blur rounded-full shadow-lg transition-all hover:scale-105 font-semibold text-red-600"
            aria-label="Quitter la liste"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Quitter</span>
          </button>
        )}
      </div>
    </div>
  );
}
