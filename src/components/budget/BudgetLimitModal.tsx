// 📄 src/components/budget/BudgetLimitModal.tsx
// 🧠 Modal pour définir/modifier une limite de budget

import { useState } from 'react';
import { FOCUS_RING } from '../../utils/constants';
import Toast from '../Toast';
import { setBudgetLimit, removeBudgetLimit } from '../../hooks/useBudgetLimits';
import type { BudgetType } from '../../types/db';

interface BudgetLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  budgetType: BudgetType;
  budgetName: string;
  year: number;
  currentLimit: number | null;
  onSuccess: () => void;
}

export function BudgetLimitModal({
  isOpen,
  onClose,
  userId,
  budgetType,
  budgetName,
  year,
  currentLimit,
  onSuccess
}: BudgetLimitModalProps) {
  const [limitAmount, setLimitAmount] = useState(currentLimit?.toString() || '');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const limit = limitAmount.trim() === '' ? null : parseFloat(limitAmount);

      if (limit !== null && limit <= 0) {
        setToast({ message: 'La limite doit être supérieure à 0', type: 'error' });
        return;
      }

      await setBudgetLimit(userId, budgetType, year, limit);

      setToast({
        message: limit === null ? 'Limite supprimée' : 'Limite définie !',
        type: 'success'
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } catch (err) {
      console.error('Erreur setBudgetLimit:', err);
      setToast({ message: 'Erreur lors de l\'enregistrement', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveLimit = async () => {
    if (!currentLimit) return;
    if (!confirm('Supprimer la limite et revenir à un budget illimité ?')) return;

    try {
      setSubmitting(true);
      await removeBudgetLimit(userId, budgetType, year);
      setToast({ message: 'Limite supprimée', type: 'success' });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } catch (err) {
      console.error('Erreur removeBudgetLimit:', err);
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                💰 Définir une limite
              </h2>
              <button
                onClick={onClose}
                className={`p-2 hover:bg-white/20 rounded-lg transition-all ${FOCUS_RING}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-purple-100 mt-2">
              {budgetName}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Limite mensuelle (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  placeholder="Ex: 500"
                  className={`w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg ${FOCUS_RING}`}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Laissez vide pour un budget illimité
                </p>
              </div>

              {currentLimit && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Limite actuelle : <span className="font-bold">{currentLimit}€</span>
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 mt-6">
              {currentLimit && (
                <button
                  type="button"
                  onClick={handleRemoveLimit}
                  disabled={submitting}
                  className={`flex-1 px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl transition-all disabled:opacity-50 ${FOCUS_RING}`}
                >
                  Supprimer
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all ${FOCUS_RING}`}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 ${FOCUS_RING}`}
              >
                {submitting ? 'Enregistrement...' : 'Valider'}
              </button>
            </div>
          </form>
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
