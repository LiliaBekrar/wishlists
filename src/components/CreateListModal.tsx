// 📄 CreateListModal.tsx
// 🧠 Rôle : Modal de création de liste responsive mobile-first
import { useState } from 'react';
import { getBannerByTheme, type ThemeType } from './banners';
import { THEMES, VISIBILITIES, FOCUS_RING, BANNER_HEIGHT } from '../utils/constants';

type VisibilityType = 'privée' | 'partagée' | 'publique';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    theme: ThemeType;
    visibility: VisibilityType;
  }) => Promise<void>;
}

export default function CreateListModal({ isOpen, onClose, onSubmit }: CreateListModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<ThemeType>('autre');
  const [visibility, setVisibility] = useState<VisibilityType>('privée');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({ name, description, theme, visibility });
      // Reset form
      setName('');
      setDescription('');
      setTheme('autre');
      setVisibility('privée');
      onClose();
    } catch (error) {
      console.error('❌ Erreur création liste:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  // ✅ Récupérer le composant de bannière via helper typé
  const BannerComponent = getBannerByTheme(theme);

  // ✅ Clés typées depuis THEMES sans forcer ThemeType si la constante évolue
  const themeKeys = Object.keys(THEMES) as Array<keyof typeof THEMES>;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl">

        {/* Header avec aperçu bannière */}
        <div className="relative overflow-hidden rounded-t-xl sm:rounded-t-2xl md:rounded-t-3xl">
          {/* Bannière en z-0 */}
          <div className="relative z-0">
            <BannerComponent height={BANNER_HEIGHT.small} />
          </div>

          {/* Bouton fermer toujours au-dessus */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute z-20 top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fermer la modal"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Titre sur la bannière (sous la croix, au-dessus de la bannière) */}
          <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
            <h2
              id="modal-title"
              className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg text-center"
            >
              Créer une nouvelle liste 🎁
            </h2>
          </div>
        </div>

        {/* Formulaire responsive */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">

          {/* Nom de la liste */}
          <div>
            <label htmlFor="list-name" className="block text-sm font-semibold text-gray-700 mb-2">
              Nom de la liste *
            </label>
            <input
              id="list-name"
              type="text"
              placeholder="Ex: Noël 2025, Mon anniversaire..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed`}
              required
              maxLength={100}
              disabled={loading}
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">{name.length}/100 caractères</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="list-description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              id="list-description"
              placeholder="Quelques mots pour décrire ta liste..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all resize-none ${FOCUS_RING} hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed`}
              maxLength={500}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">{description.length}/500 caractères</p>
          </div>

          {/* Choix du thème - responsive grid */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Thème de la liste *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
              {themeKeys.map((themeKey) => {
                const themeData = THEMES[themeKey];
                const themeValue = themeKey as ThemeType;
                const isSelected = theme === themeValue;

                return (
                  <button
                    key={themeKey as string}
                    type="button"
                    onClick={() => setTheme(themeValue)}
                    disabled={loading}
                    className={`
                      relative p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all
                      ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                      }
                      ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    aria-pressed={isSelected}
                    aria-label={`Thème ${themeData.label}`}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">
                        {themeData.label.split(' ')[1]}
                      </div>
                      <div className={`text-xs font-medium ${isSelected ? 'text-purple-700' : 'text-gray-600'}`}>
                        {themeData.label.split(' ')[0]}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Choix de la visibilité - responsive */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Visibilité *
            </label>
            <div className="space-y-2 sm:space-y-3">
              {(Object.keys(VISIBILITIES) as VisibilityType[]).map((visKey) => {
                const visData = VISIBILITIES[visKey];
                const isSelected = visibility === visKey;

                return (
                  <button
                    key={visKey}
                    type="button"
                    onClick={() => setVisibility(visKey)}
                    disabled={loading}
                    className={`
                      w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all
                      ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                      }
                      ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Visibilité ${visData.label}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-semibold mb-1 text-sm sm:text-base ${
                            isSelected ? 'text-purple-700' : 'text-gray-900'
                          }`}
                        >
                          {visData.label}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                          {visData.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Boutons actions responsive */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS_RING}`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={`flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed ${FOCUS_RING}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Création...
                </span>
              ) : (
                '✨ Créer ma liste'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
