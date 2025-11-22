// 📄 src/hooks/useBudgetLimits.ts
// 🧠 Gérer les limites des budgets auto

import { supabase } from '../lib/supabaseClient';
import type { BudgetType } from '../types/db';

/**
 * Définir/Modifier une limite de budget
 */
export async function setBudgetLimit(
  userId: string,
  type: BudgetType,
  year: number,
  limitAmount: number | null
) {
  // ✅ Chercher si une limite existe déjà
  const { data: existing } = await supabase
    .from('budget_goals')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .eq('year', year)
    .maybeSingle();

  if (existing) {
    // ✅ UPDATE
    const { error } = await supabase
      .from('budget_goals')
      .update({
        limit_amount: limitAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    // ✅ INSERT
    const name = type === 'annuel' ? `Budget ${year}` : type;

    const { error } = await supabase
      .from('budget_goals')
      .insert({
        user_id: userId,
        name,
        type,
        year,
        limit_amount: limitAmount
      });

    if (error) throw error;
  }
}

/**
 * Supprimer une limite (revenir à "illimité")
 */
export async function removeBudgetLimit(
  userId: string,
  type: BudgetType,
  year: number
) {
  const { error } = await supabase
    .from('budget_goals')
    .delete()
    .eq('user_id', userId)
    .eq('type', type)
    .eq('year', year);

  if (error) throw error;
}
