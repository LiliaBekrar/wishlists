// 📄 src/components/Profile/ProfileWishlists.tsx
// 🧠 Rôle : Affiche une grille de listes avec emojis thématiques + compteur

import { useNavigate } from 'react-router-dom';
import { FOCUS_RING, THEMES } from '../../utils/constants';
import type { ThemeType } from '../../utils/constants';

interface Wishlist {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  theme: ThemeType;
}

interface ProfileWishlistsProps {
  title: string;
  icon: string;
  wishlists: Wishlist[];
  wishlistsWithCounts: Map<string, number>;
  emptyMessage: string;
  emptySubtitle?: string;
  description?: string;
  colorScheme?: 'purple' | 'blue';
}

export default function ProfileWishlists({
  title,
  icon,
  wishlists,
  wishlistsWithCounts,
  emptyMessage,
  emptySubtitle,
  description,
  colorScheme = 'purple'
}: ProfileWishlistsProps) {
  const navigate = useNavigate();

  const getThemeEmoji = (theme: ThemeType) => {
    return THEMES[theme]?.label.split(' ')[1] || '🎁';
  };

  const colors = {
    purple: {
      badge: 'bg-purple-100 text-purple-700',
      border: 'border-purple-200/50 hover:border-purple-400',
      gradient: 'from-white to-purple-50/30',
      text: 'text-purple-600',
      count: 'text-purple-600'
    },
    blue: {
      badge: 'bg-blue-100 text-blue-700',
      border: 'border-blue-200/50 hover:border-blue-400',
      gradient: 'from-white to-blue-50/30',
      text: 'text-blue-600',
      count: 'text-blue-600'
    }
  };

  const scheme = colors[colorScheme];

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-4xl">{icon}</span>
          {title}
        </h2>
        <span className={`text-lg font-bold ${scheme.count}`}>
          {wishlists.length}
        </span>
      </div>

      {wishlists.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-600 text-lg">{emptyMessage}</p>
          {emptySubtitle && (
            <p className="text-gray-500 text-sm mt-2">{emptySubtitle}</p>
          )}
        </div>
      ) : (
        <>
          {description && (
            <p className="text-gray-600 mb-6 text-sm">{description}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlists.map((w) => {
              const themeEmoji = getThemeEmoji(w.theme);
              const itemCount = wishlistsWithCounts.get(w.id) || 0;

              return (
                <button
                  key={w.id}
                  onClick={() => navigate(`/list/${w.slug}`)}
                  className={`
                    text-left
                    bg-gradient-to-br ${scheme.gradient}
                    rounded-2xl shadow-lg border-2 ${scheme.border}
                    p-6
                    hover:shadow-2xl hover:-translate-y-2
                    transition-all duration-300
                    group
                    ${FOCUS_RING}
                  `}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className={`text-xl font-bold text-gray-900 group-hover:${scheme.text} transition-colors line-clamp-2 leading-tight flex-1`}>
                      {w.name}
                    </h3>
                    <span className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                      {themeEmoji}
                    </span>
                  </div>

                  {w.description ? (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                      {w.description}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mb-4 italic">
                      Une liste pleine de surprises...
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-xs px-3 py-1 rounded-full ${scheme.badge} font-semibold`}>
                      {THEMES[w.theme]?.label || 'Autre 🎁'}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                      {itemCount} {itemCount > 1 ? 'cadeaux' : 'cadeau'}
                    </span>
                  </div>

                  <div className={`flex items-center gap-2 text-sm ${scheme.text} font-bold group-hover:gap-3 transition-all mt-4`}>
                    <span>Découvrir →</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
