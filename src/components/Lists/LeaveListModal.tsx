// 📄 src/components/Lists/LeaveListModal.tsx
// 🧠 Rôle : Modal de confirmation pour quitter une liste

import { FOCUS_RING } from '../../utils/constants';

interface LeaveListModalProps {
  isOpen: boolean;
  wishlistName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function LeaveListModal({
  isOpen,
  wishlistName,
  onConfirm,
  onCancel,
  loading = false,
}: LeaveListModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </div>

        {/* Titre */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Quitter cette liste ?
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          Tu es sur le point de quitter <strong>&quot;{wishlistName}&quot;</strong>.
          <br />
          <span className="text-sm text-gray-500 mt-2 block">
            Tu pourras y revenir en demandant un nouvel accès au propriétaire.
          </span>
        </p>

        {/* Avertissement */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-blue-800">
              <strong>Info :</strong> Tes réservations sur cette liste resteront actives (non libérées automatiquement).
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className={`flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-semibold py-3 rounded-xl transition-all ${FOCUS_RING}`}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 rounded-xl transition-all ${FOCUS_RING}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                En cours...
              </span>
            ) : (
              '🚪 Quitter la liste'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
