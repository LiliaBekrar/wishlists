// 📄 src/utils/budgetCalculations.ts
// 🧠 Rôle : Fonctions de calcul pour les budgets

import { BUDGET_THRESHOLDS } from './constants';
import type { BudgetData, BudgetGoal, Claim, ExternalGift } from '../types/db';

/**
 * Calcule le seuil de couleur du budget (🟢/🟠/🔴)
 */
export function getBudgetThreshold(spent: number, limit?: number | null): 'green' | 'orange' | 'red' {
  if (!limit || limit === 0) return 'green'; // Pas de limite → toujours vert

  const percentage = (spent / limit) * 100;

  if (percentage < BUDGET_THRESHOLDS.GREEN) return 'green';
  if (percentage < BUDGET_THRESHOLDS.ORANGE) return 'orange';
  return 'red';
}

/**
 * Calcule le pourcentage dépensé
 */
export function getBudgetProgress(spent: number, limit?: number | null): number {
  if (!limit || limit === 0) return 0;
  return Math.round((spent / limit) * 100);
}

/**
 * Transforme un BudgetGoal en BudgetData (avec calculs)
 */
export function enrichBudgetData(
  budgetGoal: BudgetGoal,
  spent: number,
  itemsCount: number
): BudgetData {
  const progress = getBudgetProgress(spent, budgetGoal.limit_amount);
  const threshold = getBudgetThreshold(spent, budgetGoal.limit_amount);

  return {
    budgetGoal,
    spent,
    progress,
    threshold,
    itemsCount
  };
}

/**
 * Filtre les budgets par année (pour n'afficher que ceux de l'année en cours + N-1 pour Noël)
 */
export function filterRelevantBudgets(budgets: BudgetGoal[]): BudgetGoal[] {
  const currentYear = new Date().getFullYear();

  return budgets.filter(budget => {
    // Budgets personnalisés : toujours affichés
    if (budget.type === 'personnalisé') return true;

    // Budgets auto : année courante
    if (budget.year === currentYear) return true;

    // Exception : Noël N-1 (pour voir l'historique de Noël dernier)
    if (budget.type === 'noël' && budget.year === currentYear - 1) return true;

    return false;
  });
}

/**
 * Vérifie si une date est dans la période d'un budget
 * IMPORTANT : Toutes les périodes sont 1er janv → 31 déc (année civile)
 */
export function isDateInBudgetPeriod(
  date: string | Date,
  _budgetType: string,
  budgetYear: number
): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();

  // Année civile simple pour tous les budgets
  return year === budgetYear;
}

/**
 * Calcule le total dépensé pour un budget annuel
 */
export function calculateAnnualSpent(
  claims: Claim[],
  externalGifts: ExternalGift[],
  year: number
): number {
  let total = 0;

  // Claims in-app
  claims.forEach(claim => {
    const claimDate = claim.reserved_at || claim.created_at;
    if (!claimDate) return;

    const claimYear = new Date(claimDate).getFullYear();
    if (claimYear === year) {
      total += claim.paid_amount || claim.items?.price || 0;
    }
  });

  // External gifts
  externalGifts.forEach(gift => {
    const giftYear = new Date(gift.purchase_date).getFullYear();
    if (giftYear === year) {
      total += gift.paid_amount;
    }
  });

  return total;
}

/**
 * Calcule le total dépensé pour un budget thématique (noël, anniversaire, etc.)
 * ✅ CORRIGÉ : Utilise original_theme si wishlist supprimée
 */
export function calculateThemeSpent(
  claims: Claim[],
  externalGifts: ExternalGift[],
  theme: string,
  year: number
): number {
  let total = 0;

  // Claims in-app (avec fallback sur original_theme)
  claims.forEach(claim => {
    const claimDate = claim.reserved_at || claim.created_at;
    if (!claimDate) return;

    const claimYear = new Date(claimDate).getFullYear();

    // ✅ Priorité : theme de la wishlist actuelle, sinon original_theme
    const claimTheme = claim.items?.wishlists?.theme || claim.items?.original_theme || 'autre';

    if (claimYear === year && claimTheme === theme) {
      total += claim.paid_amount || claim.items?.price || 0;
    }
  });

  // External gifts
  externalGifts.forEach(gift => {
    const giftYear = new Date(gift.purchase_date).getFullYear();
    if (giftYear === year && gift.theme === theme) {
      total += gift.paid_amount;
    }
  });

  return total;
}

/**
 * Compte le nombre de cadeaux pour un budget annuel
 */
export function countAnnualItems(
  claims: Claim[],
  externalGifts: ExternalGift[],
  year: number
): number {
  let count = 0;

  claims.forEach(claim => {
    const claimDate = claim.reserved_at || claim.created_at;
    if (!claimDate) return;

    const claimYear = new Date(claimDate).getFullYear();
    if (claimYear === year) count++;
  });

  externalGifts.forEach(gift => {
    const giftYear = new Date(gift.purchase_date).getFullYear();
    if (giftYear === year) count++;
  });

  return count;
}

/**
 * Compte le nombre de cadeaux pour un budget thématique
 * ✅ CORRIGÉ : Utilise original_theme si wishlist supprimée
 */
export function countThemeItems(
  claims: Claim[],
  externalGifts: ExternalGift[],
  theme: string,
  year: number
): number {
  let count = 0;

  claims.forEach(claim => {
    const claimDate = claim.reserved_at || claim.created_at;
    if (!claimDate) return;

    const claimYear = new Date(claimDate).getFullYear();

    // ✅ Priorité : theme de la wishlist actuelle, sinon original_theme
    const claimTheme = claim.items?.wishlists?.theme || claim.items?.original_theme || 'autre';

    if (claimYear === year && claimTheme === theme) count++;
  });

  externalGifts.forEach(gift => {
    const giftYear = new Date(gift.purchase_date).getFullYear();
    if (giftYear === year && gift.theme === theme) count++;
  });

  return count;
}
