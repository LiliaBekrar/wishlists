/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/hooks/useBudgetForList.ts
// 🧠 Rôle : Hook pour calculer le budget dépensé sur une liste spécifique


import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Claim } from '../types/db';

/**
 * Hook pour récupérer le montant dépensé sur une liste spécifique
 */
export function useBudgetForList(userId: string, wishlistId: string) {
  const [spent, setSpent] = useState(0);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [limit, setLimit] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !wishlistId) return;

    async function fetchData() {
      try {
        setLoading(true);

        // 1️⃣ Récupérer les claims de l'utilisateur pour cette liste
        const { data: claimsData, error: claimsError } = await supabase
          .from('claims')
          .select(`
            *,
            items!inner(
              price,
              wishlist_id
            )
          `)
          .eq('user_id', userId)
          .eq('items.wishlist_id', wishlistId)
          .in('status', ['réservé']);

        if (claimsError) throw claimsError;

        // 2️⃣ Calculer le total dépensé
        const total = claimsData?.reduce((sum, claim) => {
          return sum + (claim.paid_amount || claim.items?.price || 0);
        }, 0) || 0;

        setClaims(claimsData || []);
        setSpent(total);

        // 3️⃣ Récupérer la limite (si définie)
        const { data: limitData } = await supabase
          .from('list_budget_limits')
          .select('limit_amount')
          .eq('user_id', userId)
          .eq('wishlist_id', wishlistId)
          .single();

        setLimit(limitData?.limit_amount || null);
      } catch (err: any) {
        console.error('Erreur useBudgetForList:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, wishlistId]);

  return { spent, claims, limit, loading, error };
}

/**
 * Définir/modifier la limite de budget pour une liste
 */
export async function setListBudgetLimit(
  userId: string,
  wishlistId: string,
  limitAmount: number | null
) {
  if (limitAmount === null) {
    // Supprimer la limite
    const { error } = await supabase
      .from('list_budget_limits')
      .delete()
      .eq('user_id', userId)
      .eq('wishlist_id', wishlistId);

    if (error) throw error;
  } else {
    // Créer ou mettre à jour la limite
    const { error } = await supabase
      .from('list_budget_limits')
      .upsert({
        user_id: userId,
        wishlist_id: wishlistId,
        limit_amount: limitAmount
      });

    if (error) throw error;
  }
}
