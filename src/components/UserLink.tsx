// 📄 src/components/UserLink.tsx
// 🧠 Rôle : Composant réutilisable pour afficher un utilisateur avec lien vers son profil
// 🛠️ Auteur : Claude IA pour WishLists v7

import { Link } from 'react-router-dom';
import ProfileAvatar from './Profile/ProfileAvatar';

interface UserLinkProps {
  username: string; // 🆕 username au lieu de userId
  displayName: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  variant?: 'default' | 'light'; // Style texte (dark ou light pour fond sombre)
  className?: string;
}

export default function UserLink({
  username,
  displayName,
  avatarUrl,
  size = 'md',
  showName = true,
  variant = 'default',
  className = '',
}: UserLinkProps) {
  const textColor = variant === 'light'
    ? 'text-white hover:text-white/80'
    : 'text-gray-800 hover:text-blue-600';

  return (
    <Link
      to={`/profile/${username}`} // 🆕 Utilise username au lieu de userId
      className={`inline-flex items-center gap-2 transition-opacity hover:opacity-90 rounded-full ${className}`}
      aria-label={`Voir le profil de ${displayName}`}
    >
      <ProfileAvatar
        avatarUrl={avatarUrl}
        displayName={displayName}
        size={size}
        clickable={false} // Désactive les effets hover (géré par le Link parent)
        className="rounded-full object-cover shadow-2xl transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(236,72,153,0.8)] animate-scale-in"
      />

      {showName && (
        <span className={`text-xl font-semibold transition-colors ${textColor}`}>
          {displayName}
        </span>
      )}
    </Link>
  );
}
