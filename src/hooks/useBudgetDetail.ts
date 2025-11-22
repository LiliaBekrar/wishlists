/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/hooks/useBudgetDetail.ts
// 🧠 Rôle : Récupérer les détails d'un budget spécifique avec groupement par destinataire

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { BudgetType } from '../types/db';

export interface BudgetGift {
  id: string;
  title: string;
  recipient_name: string;
  recipient_id: string;
  announced_price: number;
  paid_amount: number | null;
  shipping_cost: number;
  total_price: number;
  date: string;
  source: 'in-app' | 'external';
  wishlist_name?: string;
  wishlist_slug?: string;
  claim_id?: string;
  theme?: string;
  external_gift_data?: any;
}

export interface RecipientGroup {
  recipient_id: string;
  recipient_name: string;
  total_spent: number;
  gift_count: number;
  gifts: BudgetGift[];
}

interface BudgetDetailStats {
  count: number;
  average: number;
  min: number;
  max: number;
  total_shipping: number;
  gifts_without_paid_amount: number;
  biggest_discount: number;
}

interface BudgetInsights {
  imbalance?: { recipient1: string; amount1: number; recipient2: string; amount2: number };
  budget_status: 'safe' | 'warning' | 'exceeded';
  missing_prices_count: number;
}

export function useBudgetDetail(userId: string, year: number, budgetType: BudgetType) {
  const [gifts, setGifts] = useState<BudgetGift[]>([]);
  const [recipientGroups, setRecipientGroups] = useState<RecipientGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [limit, setLimit] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchBudgetDetail() {
      try {
        setLoading(true);
        setError(null);

        // 1️⃣ Récupérer la limite
        const { data: limitData } = await supabase
          .from('budget_goals')
          .select('limit_amount')
          .eq('user_id', userId)
          .eq('type', budgetType)
          .eq('year', year)
          .maybeSingle();

        setLimit(limitData?.limit_amount || null);

        // 2️⃣ Récupérer les claims in-app
        const { data: claimsRaw, error: claimsError } = await supabase
          .from('claims')
          .select(`
            id,
            created_at,
            paid_amount,
            items!inner (
              id,
              title,
              price,
              shipping_cost,
              original_theme,
              wishlists (
                id,
                name,
                slug,
                theme,
                owner_id,
                profiles!wishlists_owner_id_fkey (
                  id,
                  display_name
                )
              )
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'réservé');

        if (claimsError) throw claimsError;

        const filteredClaims = (claimsRaw || []).filter((claim: any) => {
          const claimYear = new Date(claim.created_at).getFullYear();
          if (claimYear !== year) return false;

          if (budgetType === 'annuel') return true;

          const item = claim.items;
          const theme = item?.wishlists?.theme || item?.original_theme;
          return theme === budgetType;
        });

        // 3️⃣ Récupérer les external gifts
        const { data: externalGifts } = await supabase
          .from('external_gifts')
          .select('*')
          .eq('user_id', userId);

        const filteredExternal = (externalGifts || []).filter((gift: any) => {
          const giftYear = new Date(gift.purchase_date).getFullYear();
          if (giftYear !== year) return false;

          if (budgetType === 'annuel') return true;

          return gift.theme === budgetType;
        });

        // 4️⃣ Formater les cadeaux in-app
        const inAppGifts: BudgetGift[] = filteredClaims.map((claim: any) => {
          const item = claim.items;
          const wishlist = item?.wishlists;
          const announcedPrice = item?.price || 0;
          const shipping = item?.shipping_cost || 0;
          const paidAmount = claim.paid_amount;

          const totalPrice = paidAmount !== null && paidAmount !== undefined
            ? paidAmount
            : announcedPrice + shipping;

          return {
            id: claim.id,
            title: item?.title || 'Sans titre',
            recipient_name: wishlist?.profiles?.display_name || 'Inconnu',
            recipient_id: wishlist?.owner_id || '',
            announced_price: announcedPrice,
            paid_amount: paidAmount,
            shipping_cost: shipping,
            total_price: totalPrice,
            date: claim.created_at,
            source: 'in-app',
            wishlist_name: wishlist?.name || 'Liste supprimée',
            wishlist_slug: wishlist?.slug || null,
            claim_id: claim.id,
          };
        });

        // 5️⃣ Formater les cadeaux externes
        const recipientIds = [...new Set(filteredExternal.map((g: any) => g.recipient_id).filter(Boolean))];
        const namesMap = new Map<string, string>();

        if (recipientIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', recipientIds);

          const { data: externalRecipients } = await supabase
            .from('external_recipients')
            .select('id, name')
            .in('id', recipientIds);

          recipientIds.forEach(id => {
            const profile = profiles?.find(p => p.id === id);
            const external = externalRecipients?.find(e => e.id === id);
            namesMap.set(id, profile?.display_name || external?.name || 'Inconnu');
          });
        }

        const externalGiftsList: BudgetGift[] = filteredExternal.map((gift: any) => ({
          id: gift.id,
          title: gift.description || 'Cadeau hors app',
          recipient_name: namesMap.get(gift.recipient_id) || 'Inconnu',
          recipient_id: gift.recipient_id,
          announced_price: gift.paid_amount || 0,
          paid_amount: gift.paid_amount || 0,
          shipping_cost: 0,
          total_price: gift.paid_amount || 0,
          date: gift.purchase_date,
          source: 'external',
          theme: gift.theme,
          external_gift_data: gift,
        }));

        // 6️⃣ Combiner et trier
        const allGifts = [...inAppGifts, ...externalGiftsList].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // 7️⃣ Grouper par destinataire
        const groupsMap = new Map<string, RecipientGroup>();

        allGifts.forEach(gift => {
          const key = gift.recipient_id || 'unknown';
          if (!groupsMap.has(key)) {
            groupsMap.set(key, {
              recipient_id: key,
              recipient_name: gift.recipient_name,
              total_spent: 0,
              gift_count: 0,
              gifts: [],
            });
          }

          const group = groupsMap.get(key)!;
          group.gifts.push(gift);
          group.total_spent += gift.total_price;
          group.gift_count++;
        });

        const groups = Array.from(groupsMap.values()).sort((a, b) => b.total_spent - a.total_spent);

        const total = allGifts.reduce((sum, gift) => sum + gift.total_price, 0);

        setGifts(allGifts);
        setRecipientGroups(groups);
        setTotalSpent(total);
      } catch (err: any) {
        console.error('❌ Erreur useBudgetDetail:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBudgetDetail();
  }, [userId, year, budgetType]);

  // 📊 Calcul des stats
  const stats: BudgetDetailStats = {
    count: gifts.length,
    average: gifts.length > 0 ? totalSpent / gifts.length : 0,
    min: gifts.length > 0 ? Math.min(...gifts.map(g => g.total_price)) : 0,
    max: gifts.length > 0 ? Math.max(...gifts.map(g => g.total_price)) : 0,
    total_shipping: gifts
      .filter(g => g.source === 'in-app')
      .reduce((sum, g) => sum + g.shipping_cost, 0),
    gifts_without_paid_amount: gifts.filter(
      g => g.source === 'in-app' && (g.paid_amount === null || g.paid_amount === undefined)
    ).length,
    biggest_discount: Math.max(
      ...gifts
        .filter(g => g.source === 'in-app' && g.paid_amount !== null)
        .map(g => g.announced_price + g.shipping_cost - (g.paid_amount || 0)),
      0
    ),
  };

  // 💡 Insights
  const insights: BudgetInsights = {
    budget_status: !limit || limit === 0
      ? 'safe'
      : totalSpent >= limit
      ? 'exceeded'
      : totalSpent >= limit * 0.9
      ? 'warning'
      : 'safe',
    missing_prices_count: stats.gifts_without_paid_amount,
  };

  if (recipientGroups.length >= 2) {
    const [first, ...rest] = recipientGroups;
    const lowest = rest[rest.length - 1];

    if (first.total_spent > lowest.total_spent * 2) {
      insights.imbalance = {
        recipient1: first.recipient_name,
        amount1: first.total_spent,
        recipient2: lowest.recipient_name,
        amount2: lowest.total_spent,
      };
    }
  }

  const updatePaidAmount = async (claimId: string, paidAmount: number) => {
    const { error } = await supabase
      .from('claims')
      .update({ paid_amount: paidAmount })
      .eq('id', claimId);

    if (error) throw error;

    window.location.reload();
  };

  const deleteExternalGift = async (giftId: string) => {
    const { error } = await supabase
      .from('external_gifts')
      .delete()
      .eq('id', giftId);

    if (error) throw error;

    window.location.reload();
  };

  const cancelClaim = async (claimId: string) => {
    const { error } = await supabase
      .from('claims')
      .update({ status: 'annulé' })
      .eq('id', claimId);

    if (error) throw error;

    window.location.reload();
  };

  return {
    gifts,
    recipientGroups,
    loading,
    error,
    totalSpent,
    limit,
    stats,
    insights,
    updatePaidAmount,
    deleteExternalGift,
    cancelClaim,
  };
}
