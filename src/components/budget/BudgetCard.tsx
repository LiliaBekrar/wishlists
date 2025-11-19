// 📄 src/components/budget/BudgetCard.tsx
// 🧠 Rôle : Carte d'affichage d'un budget (version épurée)

import React from 'react';
import type { BudgetData } from '../../types/db';
import { formatPrice } from '../../utils/format';
import { BUDGET_TYPE_LABELS, FOCUS_RING } from '../../utils/constants';

interface BudgetCardProps {
  budgetData: BudgetData;
  onEditLimit: () => void;
}

export function BudgetCard({ budgetData, onEditLimit }: BudgetCardProps) {
  const { budgetGoal, spent, progress, threshold, itemsCount } = budgetData;

  // Couleurs selon le seuil (plus subtiles)
  const thresholdColors = {
    green: {
      bg: 'from-white to-green-50/30',
      border: 'border-green-300/50',
      text: 'text-green-700',
      accent: 'bg-green-500',
      progressBg: 'bg-green-100',
      progressBar: 'bg-green-500',
    },
    orange: {
      bg: 'from-white to-orange-50/30',
      border: 'border-orange-300/50',
      text: 'text-orange-700',
      accent: 'bg-orange-500',
      progressBg: 'bg-orange-100',
      progressBar: 'bg-orange-500',
    },
    red: {
      bg: 'from-white to-red-50/30',
      border: 'border-red-300/50',
      text: 'text-red-700',
      accent: 'bg-red-500',
      progressBg: 'bg-red-100',
      progressBar: 'bg-red-500',
    }
  };

  const colors = thresholdColors[threshold];
  const label = BUDGET_TYPE_LABELS[budgetGoal.type] || budgetGoal.type;

  return (
    <div className={`
      group relative
      bg-gradient-to-br ${colors.bg}
      backdrop-blur-sm
      rounded-xl
      border-2 ${colors.border}
      p-5
      hover:shadow-lg
      transition-all duration-300
      hover:-translate-y-1
      hover:border-purple-400
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 truncate">
            {label}
          </h3>
          <p className="text-xs text-gray-500">
            {itemsCount} cadeau{itemsCount > 1 ? 'x' : ''}
          </p>
        </div>

        {/* Indicateur de seuil (plus discret) */}
        <div className={`w-2.5 h-2.5 rounded-full ${colors.accent} ring-2 ring-white shadow-sm flex-shrink-0`} />
      </div>

      {/* Montant */}
      <div className="mb-3">
        <p className={`text-2xl font-bold ${colors.text}`}>
          {formatPrice(spent)}
        </p>
      </div>

      {/* Barre de progression (si limite définie) */}
      {budgetGoal.limit_amount ? (
        <div className="space-y-2">
          <div className={`w-full h-2 ${colors.progressBg} rounded-full overflow-hidden`}>
            <div
              className={`h-full ${colors.progressBar} transition-all duration-500`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              {formatPrice(budgetGoal.limit_amount)} max
            </span>
            <span className={`font-semibold ${colors.text}`}>
              {progress}%
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={onEditLimit}
          className={`
            w-full text-sm font-medium text-purple-600 hover:text-purple-700
            py-2 px-3 rounded-lg bg-purple-50/50 hover:bg-purple-100/80
            transition-all ${FOCUS_RING}
          `}
        >
          + Définir une limite
        </button>
      )}
    </div>
  );
}
