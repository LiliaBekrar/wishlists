// 📄 src/components/Profile/ProfileBanner.tsx
// 🧠 Rôle : Bannière complète du profil (avec ModernBanner qui s'adapte)

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
  return (
    <div className="relative">
      {/* Bannière ModernBanner en background */}
      <div className="absolute inset-0 w-full" style={{ height: '100%' }}>
        <ModernBanner height="100%" />
      </div>

      {/* Actions (boutons) */}
      <div className="relative z-30">
        <ProfileActions
          onBack={onBack}
          onShare={onShare}
          onEdit={onEdit}
          onViewPublicProfile={onViewPublicProfile}
          isPrivate={isPrivate}
        />
      </div>

      {/* Contenu avec hauteur naturelle */}
      <div className="relative z-10 flex items-center justify-center px-4 py-16 sm:py-20 min-h-[500px]">
        <div className="text-center text-white max-w-3xl w-full space-y-4 sm:space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <ProfileAvatar avatarUrl={avatarUrl} displayName={displayName} size="lg" />
          </div>

          {/* Nom + pseudo */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold drop-shadow-2xl animate-fade-in px-4">
              {displayName}
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-white/95 font-medium drop-shadow-lg animate-fade-in px-4" style={{ animationDelay: '0.1s' }}>
              @{username}
            </p>
          </div>

          {/* Bio (si définie) */}
          {bio && (
            <div className="px-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-lg italic">
                "{bio}"
              </p>
            </div>
          )}

          {/* Stats */}
          <ProfileStats stats={stats} animationDelay="0.3s" />

          {/* Phrase d'accroche */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-full shadow-2xl border-2 border-white/30 transition-all hover:scale-105 animate-bounce-subtle" style={{ animationDelay: '0.4s' }}>
              <span className="text-lg sm:text-xl md:text-2xl animate-pulse">✨</span>
              <p className="text-xs sm:text-sm md:text-base font-bold leading-snug">
                {tagline}
              </p>
              <span className="text-lg sm:text-xl md:text-2xl animate-pulse">🎁</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
