// 📄 src/components/Profile/ProfileBanner.tsx
// 🧠 Rôle : Bannière complète du profil (version fixée)

import { BANNER_HEIGHT } from '../../utils/constants';
import ModernBanner from '../banners';
import ProfileAvatar from './ProfileAvatar';
import ProfileStats from './ProfileStats';
import ProfileActions from './ProfileActions';

interface ProfileBannerProps {
  displayName: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  stats: Array<{ value: number; label: string }>;
  tagline: string;
  isPrivate?: boolean;
  onBack: () => void;
  onShare: () => void;
  onEdit?: () => void;
  onViewPublicProfile?: () => void;
}

export default function ProfileBanner({
  displayName,
  username,
  bio,
  avatarUrl,
  stats,
  tagline,
  isPrivate = false,
  onBack,
  onShare,
  onEdit,
  onViewPublicProfile
}: ProfileBannerProps) {
  // Hauteur adaptative selon la bio
  const minHeight = bio ? '600px' : '500px';

  return (
    <div className="relative overflow-hidden" style={{ minHeight }}>
      <ModernBanner height={BANNER_HEIGHT.xlarge} />

      <ProfileActions
        onBack={onBack}
        onShare={onShare}
        onEdit={onEdit}
        onViewPublicProfile={onViewPublicProfile}
        isPrivate={isPrivate}
      />

      {/* Contenu centré */}
      <div className="absolute inset-0 flex items-center justify-center px-4 py-8">
        <div className="text-center text-white max-w-3xl w-full">
          {/* Avatar */}
          <div className="mb-4 sm:mb-6 flex justify-center">
            <ProfileAvatar avatarUrl={avatarUrl} displayName={displayName} size="lg" />
          </div>

          {/* Nom + pseudo */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-1 sm:mb-2 drop-shadow-2xl animate-fade-in px-4">
            {displayName}
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-white/95 font-medium mb-3 sm:mb-4 drop-shadow-lg animate-fade-in px-4" style={{ animationDelay: '0.1s' }}>
            @{username}
          </p>

          {/* Bio (si définie) - VERSION COMPACTE */}
          {bio && (
            <div className="mb-3 sm:mb-4 px-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <p className="text-xs sm:text-sm md:text-base text-white/90 max-w-2xl mx-auto leading-snug drop-shadow-lg italic line-clamp-2">
                "{bio}"
              </p>
            </div>
          )}

          {/* Stats - VERSION COMPACTE */}
          <div className="mb-4 sm:mb-6">
            <ProfileStats stats={stats} animationDelay="0.3s" />
          </div>

          {/* Phrase d'accroche - VERSION COMPACTE */}
          <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-full border-2 border-white/30 transition-all hover:scale-105 animate-bounce-subtle" style={{ animationDelay: '0.4s' }}>
            <span className="text-base sm:text-xl md:text-2xl animate-pulse">✨</span>
            <p className="text-xs sm:text-sm md:text-base font-bold leading-tight">
              {tagline}
            </p>
            <span className="text-base sm:text-xl md:text-2xl animate-pulse">🎁</span>
          </div>
        </div>
      </div>
    </div>
  );
}
