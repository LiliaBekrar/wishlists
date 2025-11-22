/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/hooks/useBudget.ts
// 🧠 Rôle : Budgets automatiques avec limites depuis budget_goals
// 🇫🇷 100% français + shipping_cost inclus

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { BudgetGoal, BudgetData, ThemeType } from '../types/db';

/**
 * ✅ Helper : Calculer progress, threshold
 */
function enrichBudgetData(
  budgetGoal: BudgetGoal,
  spent: number,
  itemsCount: number
): BudgetData {
  const limit = budgetGoal.limit_amount || 0;

  let progress = 0;
  let threshold: 'green' | 'orange' | 'red' = 'green';

  if (limit > 0) {
    progress = Math.round((spent / limit) * 100);

    if (progress < 90) {
      threshold = 'green';
    } else if (progress < 100) {
      threshold = 'orange';
    } else {
      threshold = 'red';
    }
  }

  return {
    budgetGoal,
    spent,
    progress,
    threshold,
    itemsCount
  };
}

/**
 * Hook principal : génère budgets automatiques avec limites
 */
export function useBudget(userId: string, year: number = new Date().getFullYear()) {
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ✅ 0. Récupérer les limites depuis budget_goals
      const { data: limitsFromDB, error: limitsError } = await supabase
        .from('budget_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year);

      if (limitsError) throw limitsError;

      // Map pour accès rapide : type → BudgetGoal
      const limitsMap = new Map<string, BudgetGoal>();
      (limitsFromDB || []).forEach(limit => {
        limitsMap.set(limit.type, limit);
      });

      // ✅ 1. Récupérer claims (items in-app)
      const { data: claimsRaw, error: claimsError } = await supabase
        .from('claims')
        .select(`
          id,
          status,
          created_at,
          reserved_at,
          items!inner (
            id,
            title,
            price,
            shipping_cost,
            original_theme,
            wishlists (
              id,
              name,
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

      const claims = claimsRaw as any[];

      // ✅ 2. Récupérer external_gifts (SANS relation pour éviter l'erreur)
      const { data: externalGifts, error: giftsError } = await supabase
        .from('external_gifts')
        .select('*')
        .eq('user_id', userId);

      if (giftsError) {
        console.error('❌ Erreur external_gifts:', giftsError);
        throw giftsError;
      }

      console.log('✅ External gifts récupérés (useBudget):', externalGifts);

      // ✅ 3. Filtrer par année + calculer total_price
      const yearClaims = (claims || [])
        .filter(claim => {
          const claimYear = new Date(claim.created_at).getFullYear();
          return claimYear === year;
        })
        .map(claim => {
          const item = claim.items;
          const wishlist = item?.wishlists;
          const price = item?.price || 0;
          const shipping = item?.shipping_cost || 0;

          return {
            id: claim.id,
            title: item?.title || 'Sans titre',
            total_price: price + shipping,
            theme: wishlist?.theme || item?.original_theme || null,
            recipient_name: wishlist?.profiles?.display_name || 'Inconnu',
            claim_date: claim.created_at
          };
        });

      const yearExternal = (externalGifts || [])
        .filter(gift => {
          const giftYear = new Date(gift.purchase_date).getFullYear();
          return giftYear === year;
        })
        .map(gift => ({
          id: gift.id,
          title: gift.description || 'Cadeau hors app',
          total_price: gift.paid_amount || 0,
          theme: gift.theme || null,
          recipient_name: 'Hors app', // Temporaire, on récupérera le vrai nom plus tard
          claim_date: gift.purchase_date
        }));

      // ✅ 4. Calculer budget annuel global
      const totalSpent =
        yearClaims.reduce((sum, c) => sum + c.total_price, 0) +
        yearExternal.reduce((sum, g) => sum + g.total_price, 0);

      const totalItems = yearClaims.length + yearExternal.length;

      // ✅ Utiliser limite depuis DB si elle existe
      const annualLimit = limitsMap.get('annuel');
      const annualGoal: BudgetGoal = annualLimit || {
        id: `auto-annuel-${year}`,
        name: `Budget ${year}`,
        type: 'annuel',
        year: year,
        limit_amount: null,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const budgetsData: BudgetData[] = [
        enrichBudgetData(annualGoal, totalSpent, totalItems)
      ];

      // ✅ 5. Générer budgets par thème
      const themesUsed = new Set<ThemeType>();
      yearClaims.forEach(c => { if (c.theme) themesUsed.add(c.theme as ThemeType); });
      yearExternal.forEach(g => { if (g.theme) themesUsed.add(g.theme as ThemeType); });

      themesUsed.forEach(theme => {
        const themeClaims = yearClaims.filter(c => c.theme === theme);
        const themeExternal = yearExternal.filter(g => g.theme === theme);

        const themeSpent =
          themeClaims.reduce((sum, c) => sum + c.total_price, 0) +
          themeExternal.reduce((sum, g) => sum + g.total_price, 0);

        const themeItems = themeClaims.length + themeExternal.length;

        // ✅ Utiliser limite depuis DB si elle existe
        const themeLimit = limitsMap.get(theme);
        const themeGoal: BudgetGoal = themeLimit || {
          id: `auto-${theme}-${year}`,
          name: theme,
          type: theme,
          year: year,
          limit_amount: null,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        budgetsData.push(enrichBudgetData(themeGoal, themeSpent, themeItems));
      });

      // ✅ Filtrer les budgets vides
      setBudgets(budgetsData.filter(b => b.itemsCount > 0));

    } catch (err: any) {
      console.error('❌ Erreur useBudget:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [userId, year]);

  return { budgets, loading, error, reload };
}

/**
 * Hook pour données donut (par personne/thème/liste)
 */
export function useBudgetDonutData(
  userId: string,
  viewMode: 'global' | 'person' | 'theme' | 'list',
  year: number
) {
  const [data, setData] = useState<Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
    items?: Array<{ title: string; price: number }>;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);

        // ✅ Claims
        const { data: claimsRaw, error: claimsError } = await supabase
          .from('claims')
          .select(`
            id,
            status,
            created_at,
            items!inner (
              id,
              title,
              price,
              shipping_cost,
              original_theme,
              original_owner_id,
              wishlists (
                id,
                name,
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

        if (claimsError) {
          console.error('❌ Erreur claims:', claimsError);
          throw claimsError;
        }

        const claims = (claimsRaw as any[])?.filter(claim => {
          const claimYear = new Date(claim.created_at).getFullYear();
          return claimYear === year;
        }) || [];

        console.log(`✅ Claims filtrés pour ${year}:`, claims.length);

        // ✅ External gifts (SANS relation pour éviter l'erreur)
        const { data: externalGiftsRaw, error: giftsError } = await supabase
          .from('external_gifts')
          .select('*')
          .eq('user_id', userId);

        if (giftsError) {
          console.error('❌ Erreur external_gifts:', giftsError);
          // ⬅️ NE PAS throw, continuer sans les external gifts
          console.warn('⚠️ Continuation sans external_gifts');
        }

        const externalGifts = externalGiftsRaw || [];

        console.log('✅ External gifts récupérés:', externalGifts.length);

        const filteredExternal = externalGifts.filter((gift: any) => {
          const giftYear = new Date(gift.purchase_date).getFullYear();
          return giftYear === year;
        });

        console.log('🔍 Debug useBudgetDonutData:', {
          viewMode,
          year,
          claimsCount: claims.length,
          externalCount: filteredExternal.length,
          totalGifts: claims.length + filteredExternal.length
        });

        // ✅ Agréger selon viewMode
        const grouped = new Map<string, number>();
        const itemsByCategory = new Map<string, Array<{ title: string; price: number }>>();

        // Helper : récupérer nom du propriétaire (pour les claims in-app)
        const getOwnerName = async (claim: any): Promise<string> => {
          if (claim.items?.wishlists?.profiles?.display_name) {
            return claim.items.wishlists.profiles.display_name;
          }
          if (claim.items?.original_owner_id) {
            const { data } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', claim.items.original_owner_id)
              .single();
            if (data?.display_name) return data.display_name;
          }
          return 'Inconnu';
        };

        // ✅ Préparer les noms de destinataires pour les external_gifts (vue "person")
        const externalRecipientNames = new Map<string, string>();

        if (viewMode === 'person' && filteredExternal.length > 0) {
          const recipientIds = Array.from(
            new Set(
              filteredExternal
                .map((g: any) => g.recipient_id)
                .filter((id: string | null) => !!id)
            )
          );

          if (recipientIds.length > 0) {
            // 1️⃣ d'abord dans profiles
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, display_name')
              .in('id', recipientIds);

            if (profilesError) {
              console.error('❌ Erreur profils destinataires (donut):', profilesError);
            }

            profilesData?.forEach((p: any) => {
              if (p.display_name) {
                externalRecipientNames.set(p.id, p.display_name);
              }
            });

            // 2️⃣ puis dans external_recipients pour ceux qui restent
            const remainingIds = recipientIds.filter(id => !externalRecipientNames.has(id));

            if (remainingIds.length > 0) {
              const { data: externalRecipientsData, error: externalRecipientsError } = await supabase
                .from('external_recipients')
                .select('id, name')
                .in('id', remainingIds);

              if (externalRecipientsError) {
                console.error('❌ Erreur external_recipients (donut):', externalRecipientsError);
              }

              externalRecipientsData?.forEach((r: any) => {
                externalRecipientNames.set(
                  r.id,
                  r.name || 'Destinataire inconnu'
                );
              });
            }
          }

          console.log('✅ Noms destinataires external (donut):', externalRecipientNames);
        }

        // Process claims
        for (const claim of claims) {
          const item = claim.items;
          const wishlist = item?.wishlists;
          const totalPrice = (item?.price || 0) + (item?.shipping_cost || 0);

          let key = '';
          if (viewMode === 'theme' || viewMode === 'global') {
            key = wishlist?.theme || item?.original_theme || 'autre';
          } else if (viewMode === 'person') {
            key = await getOwnerName(claim);
          } else if (viewMode === 'list') {
            key = wishlist?.name || 'Hors liste';
          }

          grouped.set(key, (grouped.get(key) || 0) + totalPrice);

          if (!itemsByCategory.has(key)) {
            itemsByCategory.set(key, []);
          }
          itemsByCategory.get(key)?.push({
            title: item?.title || 'Sans titre',
            price: totalPrice
          });
        }

        // Process external gifts
        filteredExternal.forEach((gift: any) => {
          const totalPrice = gift.paid_amount || 0;

          let key = '';

          if (viewMode === 'theme' || viewMode === 'global') {
            key = gift.theme || 'autre';
          } else if (viewMode === 'person') {
            // 🔥 Utiliser le vrai nom du destinataire si possible
            key =
              (gift.recipient_id && externalRecipientNames.get(gift.recipient_id)) ||
              'Cadeaux hors app';
          } else if (viewMode === 'list') {
            key = 'Cadeaux hors app';
          }

          grouped.set(key, (grouped.get(key) || 0) + totalPrice);

          if (!itemsByCategory.has(key)) {
            itemsByCategory.set(key, []);
          }
          itemsByCategory.get(key)?.push({
            title: gift.description || 'Cadeau hors app',
            price: totalPrice
          });
        });

        // ✅ Convertir en format donut
        const total = Array.from(grouped.values()).reduce((sum, val) => sum + val, 0);

        console.log(`💰 Total calculé: ${total}€`);

        if (total === 0) {
          console.warn('⚠️ Total = 0, pas de données pour le donut');
          setData([]);
          setLoading(false);
          return;
        }

        const COLORS = [
          '#8b5cf6', '#ec4899', '#3b82f6', '#10b981',
          '#f59e0b', '#ef4444', '#a855f7', '#db2777'
        ];

        const result = Array.from(grouped.entries())
          .map(([name, value], index) => ({
            name,
            value: Math.round(value * 100) / 100,
            percentage: Math.round((value / total) * 100),
            color: COLORS[index % COLORS.length],
            items: itemsByCategory.get(name) || []
          }))
          .sort((a, b) => b.value - a.value);

        console.log('✅ Donut data final:', result);
        setData(result);

      } catch (err: any) {
        console.error('❌ Erreur useBudgetDonutData:', err);
        console.error('Stack:', err.stack);
        // ⬅️ NE PAS bloquer, retourner tableau vide
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, viewMode, year]);

  return { data, loading };
}
