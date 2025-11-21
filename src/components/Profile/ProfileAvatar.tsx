// 📄 src/components/Profile/ProfileAvatar.tsx
// 🧠 Rôle : Avatar simple et réutilisable

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  displayName: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProfileAvatar({ avatarUrl, displayName, size = 'lg' }: ProfileAvatarProps) {
  const firstLetter = displayName[0]?.toUpperCase() || 'U';

  const sizeClasses = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-24 h-24 text-3xl',
    lg: 'w-32 h-32 sm:w-40 sm:h-40 text-5xl sm:text-6xl'
  };

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={`Avatar de ${displayName}`}
      className={`${sizeClasses[size]} rounded-full object-cover border-4 border-white shadow-2xl transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(236,72,153,0.8)] animate-scale-in`}
    />
  ) : (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white font-bold border-4 border-white shadow-2xl transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(236,72,153,0.8)] animate-scale-in`}>
      {firstLetter}
    </div>
  );
}
