// 📄 src/pages/dashboard-views/MyWishlistsView.tsx
// 🧠 Rôle : Vue "Mes listes" avec cartes + actions
// 🛠️ Auteur : Claude IA pour WishLists v7

import { useNavigate } from 'react-router-dom';
import { FOCUS_RING, THEMES } from '../../utils/constants';
import DropdownMenu, { type DropdownAction } from '../../components/DropdownMenu';
import type { Wishlist } from '../../hooks/useWishlists';

interface MyWishlistsViewProps {
  wishlists: Wishlist[];
  itemCounts: Record<string, number>;
  memberCounts: Record<string, number>;
  onCreateList: () => void;
  onEditList: (wishlist: Wishlist) => void;
  onManageMembers: (wishlistId: string) => void;
  onShareList: (wishlist: Wishlist) => void;
  onDeleteList: (id: string, name: string) => void;
}

export default function MyWishlistsView({
  wishlists,
  itemCounts,
  memberCounts,
  onCreateList,
  onEditList,
  onManageMembers,
  onShareList,
  onDeleteList,
}: MyWishlistsViewProps) {
  const navigate = useNavigate();

  if (wishlists.length === 0) {
    return (
      <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
        <div className="mb-6 sm:mb-8 animate-bounce-slow">
          <svg
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="60" y="80" width="80" height="70" fill="url(#giftGrad)" rx="4" />
            <rect x="60" y="80" width="80" height="12" fill="#ec4899" />
            <rect x="96" y="60" width="8" height="90" fill="#ec4899" />
            <ellipse cx="85" cy="65" rx="12" ry="8" fill="#f43f5e" />
            <ellipse cx="115" cy="65" rx="12" ry="8" fill="#f43f5e" />
            <circle cx="100" cy="60" r="6" fill="#be123c" />
            <defs>
              <linearGradient id="giftGrad" x1="60" y1="80" x2="140" y2="150">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Ta première liste t'attend !
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Crée une liste pour <strong>Noël</strong>, un <strong>anniversaire</strong>, une{' '}
          <strong>naissance</strong> ou un <strong>mariage</strong>.
        </p>
        <button
          onClick={onCreateList}
          className={`inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 ${FOCUS_RING}`}
        >
          <span>➕ Créer ma première liste</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Mes listes ({wishlists.length})
        </h2>
        <button
          onClick={onCreateList}
          className={`inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-xl transition-all ${FOCUS_RING}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Nouvelle liste</span>
        </button>
      </div>

      {/* Grille responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {wishlists.map((wishlist) => {
          const themeData = THEMES[wishlist.theme];
          const themeColors = themeData.colors;
          const itemCount = itemCounts[wishlist.id] ?? 0;
          const memberCount = memberCounts[wishlist.id] ?? 0;

          const dropdownActions: DropdownAction[] = [
            {
              label: 'Gérer les membres',
              icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ),
              onClick: () => onManageMembers(wishlist.id),
            },
            {
              label: 'Modifier la liste',
              icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              ),
              onClick: () => onEditList(wishlist),
            },
            {
              label: 'Partager la liste',
              icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              ),
              onClick: () => onShareList(wishlist),
            },
            {
              label: 'Supprimer',
              icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              ),
              onClick: () => onDeleteList(wishlist.id, wishlist.name),
              variant: 'danger',
            },
          ];

          return (
            <div
              key={wishlist.id}
              className="group relative bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100"
            >
              {/* Bannière thème */}
              <div
                className="h-32 sm:h-40 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${themeColors[0]}, ${themeColors[1]}, ${themeColors[2]})`,
                }}
              >
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl sm:text-5xl drop-shadow-lg">
                    {themeData.label.split(' ')[1]}
                  </div>
                </div>

                {/* Badge visibilité */}
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur text-xs font-medium rounded-full text-gray-700">
                    {wishlist.visibility === 'privée' && '🔒 Privée'}
                    {wishlist.visibility === 'partagée' && '🔗 Partagée'}
                    {wishlist.visibility === 'publique' && '🌍 Publique'}
                  </span>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                  {wishlist.name}
                </h3>

                {wishlist.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{wishlist.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 mb-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                      />
                    </svg>
                    <span>{itemCount} {itemCount > 1 ? 'cadeaux' : 'cadeau'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span>{memberCount} {memberCount > 1 ? 'membres' : 'membre'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/list/${wishlist.slug}`)}
                    className={`flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all ${FOCUS_RING}`}
                  >
                    Voir la liste
                  </button>

                  <div className="relative z-10">
                    <DropdownMenu actions={dropdownActions} ariaLabel="Options de la liste" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
