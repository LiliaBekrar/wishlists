// 📄 src/components/Profile/ProfileActions.tsx
// 🧠 Rôle : Boutons d'action du header (retour, partager, modifier, etc.)

import { FOCUS_RING } from '../../utils/constants';

interface ProfileActionsProps {
  onBack: () => void;
  onShare: () => void;
  onEdit?: () => void;
  onViewPublicProfile?: () => void;
  isPrivate?: boolean;
}

export default function ProfileActions({
  onBack,
  onShare,
  onEdit,
  onViewPublicProfile,
  isPrivate = false
}: ProfileActionsProps) {
  return (
    <>
      {/* Boutons gauche (retour + partager) */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-30">
        <button
          onClick={onBack}
          className={`p-2 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg transition-all hover:scale-110 ${FOCUS_RING}`}
          aria-label="Retour"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={onShare}
          className={`flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg transition-all hover:scale-105 font-semibold text-gray-700 text-sm ${FOCUS_RING}`}
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
      </div>

      {/* Boutons droite (voir profil public + modifier) */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        {isPrivate && onViewPublicProfile && (
          <button
            onClick={onViewPublicProfile}
            className={`flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg transition-all hover:scale-105 font-semibold text-gray-700 text-sm ${FOCUS_RING}`}
          >
            <span className="text-lg">👁️</span>
            <span className="hidden sm:inline">Voir profil public</span>
          </button>
        )}

        {isPrivate && onEdit && (
          <button
            onClick={onEdit}
            className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold rounded-full shadow-lg transition-all hover:scale-105 text-sm ${FOCUS_RING}`}
          >
            <span className="text-lg">✏️</span>
            <span className="hidden sm:inline">Modifier</span>
          </button>
        )}
      </div>
    </>
  );
}
