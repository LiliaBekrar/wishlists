// 📄 src/components/Profile/ProfileAvatar.tsx
// 🧠 Rôle : Avatar simple et réutilisable
// 🆕 Ajout: support clickable + className custom

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  displayName: string;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean; // 🆕 Pour désactiver les effets hover si dans un lien
  className?: string;  // 🆕 Classes CSS supplémentaires
}

export default function ProfileAvatar({
  avatarUrl,
  displayName,
  size = 'lg',
  clickable = true, // Par défaut, garde les effets hover
  className = ''
}: ProfileAvatarProps) {
  const firstLetter = displayName[0]?.toUpperCase() || 'U';

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',      // 🆕 Ajout taille xs pour header
    md: 'w-14 h-14 text-2xl',   // Renommage ancien "sm" → "md"
    lg: 'w-32 h-32 sm:w-40 sm:h-40 text-5xl sm:text-6xl'
  };

  // Effets hover uniquement si clickable
  const hoverEffects = clickable
    ? 'hover:scale-105 hover:shadow-[0_0_30px_rgba(236,72,153,0.8)]'
    : '';

  const baseClasses = `rounded-full  shadow-2xl transition-transform duration-300 ${hoverEffects} ${className}`;

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={`Avatar de ${displayName}`}
      className={`${sizeClasses[size]} ${baseClasses} border-4 border-white object-cover animate-scale-in`}
    />
  ) : (
    <div className={`${sizeClasses[size]} ${baseClasses} bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white font-bold animate-scale-in`}>
      {firstLetter}
    </div>
  );
}
