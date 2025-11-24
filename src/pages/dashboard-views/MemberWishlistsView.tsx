// 📄 src/pages/dashboard-views/MemberWishlistsView.tsx
// 🧠 Rôle : Vue "Listes auxquelles j'appartiens"

import { useNavigate } from 'react-router-dom';
import { FOCUS_RING, THEMES } from '../../utils/constants';
import UserLink from '../../components/UserLink';

interface MemberWishlist {
  wishlist_id: string;
  user_id: string;
  role: string;   // ex: 'viewer' | 'editor' | 'owner'
  status: string; // ex: 'actif' | 'en_attente'
  wishlist: {
    id: string;
    name: string;
    slug: string;
    theme: string;
    description: string | null;
    owner?: {
      username: string;
      display_name: string;
      avatar_url?: string | null;
    };
  };
}


interface MemberWishlistsViewProps {
  memberWishlists: MemberWishlist[];
}

export default function MemberWishlistsView({
  memberWishlists,
}: MemberWishlistsViewProps) {
  const navigate = useNavigate();

  if (memberWishlists.length === 0) {
    return (
      <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
        <div className="text-6xl icon-bounce-active mb-4">🎁</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Aucune liste partagée
        </h3>
        <p className="text-gray-600">
          Les listes auxquelles tu es invité apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
        Listes auxquelles j&apos;appartiens ({memberWishlists.length})
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {memberWishlists.map((member) => {
          const wl = member.wishlist;

          const themeData =
            THEMES[wl.theme as keyof typeof THEMES] ?? THEMES.autre;
          const themeColors = themeData.colors;

          return (
          <div
            key={`${member.wishlist_id}-${member.user_id}`}
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100 flex flex-col h-full"
          >
            {/* Bannière thème */}
            <div
              className="h-32 sm:h-40 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${themeColors[0]}, ${themeColors[1]}, ${themeColors[2]})`,
              }}
            >
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl sm:text-5xl drop-shadow-lg">
                  {themeData.label.split(' ')[1]}
                </div>
              </div>

              {/* Badge rôle / statut */}
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                <span className="px-2 py-1 bg-white/90 backdrop-blur text-xs font-medium rounded-full text-gray-700">
                  {member.role === 'owner' && '👑 Proprio'}
                  {member.role === 'editor' && '✏️ Éditeur'}
                  {member.role === 'viewer' && '👁️ Invité'}
                  {!['owner', 'editor', 'viewer'].includes(member.role) && member.role}
                </span>
                {member.status !== 'actif' && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[11px] font-medium rounded-full">
                    {member.status}
                  </span>
                )}
              </div>
            </div>

            {/* Contenu */}
            <div className="p-4 sm:p-6 flex flex-col flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 line-clamp-1">
                {wl.name}
              </h3>

              {wl.owner && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <span>par</span>
                  <UserLink
                    username={wl.owner.username}
                    displayName={wl.owner.display_name}
                    avatarUrl={wl.owner.avatar_url}
                    size="sm"
                    showName={false}
                    className="shrink-0"
                  />
                  <span className="font-medium text-gray-700">
                    {wl.owner.display_name}
                  </span>
                </div>
              )}

              {wl.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {wl.description}
                </p>
              )}

              <p className="text-xs text-gray-500 mb-4">
                Tu es <span className="font-semibold">Membre</span> de cette liste.
              </p>

              {/* 👇 Le bouton est poussé en bas */}
              <button
                onClick={() => navigate(`/list/${wl.slug}`)}
                className={`w-full mt-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all ${FOCUS_RING}`}
              >
                👁️ Voir la liste
              </button>
            </div>
          </div>

          );
        })}
      </div>
    </div>
  );
}
