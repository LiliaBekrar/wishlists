/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/components/Lists/ShareModal.tsx
// 🔧 FIX : Message adapté selon si c'est son propre profil ou celui de quelqu'un d'autre

import { useState } from 'react';
import { FOCUS_RING } from '../../utils/constants';
import Toast from '../Toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistSlug: string;
  wishlistName: string;
  visibility: 'privée' | 'partagée' | 'publique';
  isProfile?: boolean;
  isOwnProfile?: boolean; // ⬅️ NOUVEAU : Est-ce que c'est MON profil ou celui de quelqu'un d'autre ?
}

export default function ShareModal({
  isOpen,
  onClose,
  wishlistSlug,
  wishlistName,
  visibility,
  isProfile = false,
  isOwnProfile = true, // ⬅️ Par défaut = mon profil
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  const shareUrl = isProfile
    ? `${window.location.origin}${basePath}/profile/${wishlistSlug}`
    : `${window.location.origin}${basePath}/list/${wishlistSlug}`;

  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const getShareMessage = () => {
    // ⬅️ FIX : Message différent pour profil (selon si c'est le tien ou celui de quelqu'un d'autre)
    if (isProfile) {
      if (isOwnProfile) {
        // Depuis ProfilePrivate (mon profil)
        return `👤 ${wishlistName}\n\nDécouvre mon profil et mes listes de souhaits ! ✨\n\n${shareUrl}`;
      } else {
        // Depuis ProfilePublic (profil de quelqu'un d'autre)
        return `👤 ${wishlistName}\n\nDécouvre le profil et les listes de souhaits de ${wishlistName} ! ✨\n\n${shareUrl}`;
      }
    }

    const base = `🎁 ${wishlistName}\n\n`;

    if (visibility === 'publique') {
      return `${base}Viens découvrir ma liste de souhaits ! 🎉\n\n${shareUrl}`;
    } else if (visibility === 'partagée') {
      return `${base}Je t'invite à rejoindre ma liste de souhaits !\n\nClique sur le lien pour demander l'accès :\n${shareUrl}`;
    } else {
      return `${base}Je te partage ma liste privée 🔒\n\nClique sur le lien pour demander l'accès :\n${shareUrl}`;
    }
  };

  const handleCopyLink = async () => {
    try {
      const message = getShareMessage();
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setToast({ message: '✅ Message copié !', type: 'success' });
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      console.error('❌ Erreur copie:', error);
      setToast({ message: '❌ Erreur lors de la copie', type: 'error' });
    }
  };

  const handleShareWhatsApp = () => {
    const message = getShareMessage();
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const message = getShareMessage();
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  const handleShareEmail = () => {
    const subject = isProfile ? `👤 ${wishlistName}` : `🎁 ${wishlistName}`;
    const body = getShareMessage();
    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      '_blank'
    );
  };

  const handleNativeShare = async () => {
    if (!hasNativeShare) return;

    try {
      await (navigator as any).share({
        title: isProfile ? `👤 ${wishlistName}` : `🎁 ${wishlistName}`,
        text: getShareMessage(),
      });
      setToast({ message: '✅ Partagé !', type: 'success' });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('❌ Erreur partage:', error);
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="min-h-[100dvh] px-4 py-8 flex items-center justify-center">
          <div className="relative w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100dvh-4rem)] flex flex-col mx-auto">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 sm:p-6">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 id="modal-title" className="text-xl sm:text-2xl font-bold mb-1 pr-8">
                {isProfile ? (isOwnProfile ? 'Partager mon profil 👤' : `Partager le profil de ${wishlistName} 👤`) : 'Partager la liste 🔗'}
              </h2>
              <p className="text-xs sm:text-sm opacity-90">
                {wishlistName}
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
              {!isProfile && (
                <div
                  className={`p-3 sm:p-4 rounded-xl border-2 ${
                    visibility === 'publique'
                      ? 'bg-green-50 border-green-200'
                      : visibility === 'partagée'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 text-xl sm:text-2xl">
                      {visibility === 'publique' ? '🌍' : visibility === 'partagée' ? '🔗' : '🔒'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">
                        Liste {visibility}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-700">
                        {visibility === 'publique' && 'Tout le monde peut voir et rejoindre cette liste.'}
                        {visibility === 'partagée' && 'Les personnes avec le lien peuvent demander à rejoindre.'}
                        {visibility === 'privée' && "Les personnes doivent demander l'accès (tu devras approuver)."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  Message qui sera partagé
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 max-h-32 overflow-y-auto">
                  <p className="text-xs sm:text-sm text-gray-800 whitespace-pre-line break-words">
                    {getShareMessage()}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyLink}
                className={`w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                } font-semibold rounded-xl transition-all ${FOCUS_RING} shadow-lg text-sm sm:text-base`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Message copié !
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copier le message
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">
                  ou partager via
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={handleShareWhatsApp}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg sm:rounded-xl transition-all ${FOCUS_RING} text-xs sm:text-sm`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp
                </button>

                <button
                  onClick={handleShareTelegram}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg sm:rounded-xl transition-all ${FOCUS_RING} text-xs sm:text-sm`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  Telegram
                </button>

                <button
                  onClick={handleShareEmail}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg sm:rounded-xl transition-all ${FOCUS_RING} text-xs sm:text-sm`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </button>

                {hasNativeShare && (
                  <button
                    onClick={handleNativeShare}
                    className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg sm:rounded-xl transition-all ${FOCUS_RING} text-xs sm:text-sm`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Autres
                  </button>
                )}
              </div>

              <button
                onClick={onClose}
                className={`w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all ${FOCUS_RING} text-sm sm:text-base`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
