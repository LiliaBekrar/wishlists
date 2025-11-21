/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/hooks/useBudget.ts (VERSION FINALE CORRIGÉE)
// 🧠 Rôle : Hook pour gérer les budgets (auto calculés dynamiquement + manuels en BDD)

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { BudgetGoal, BudgetData } from '../types/db';
import {
  enrichBudgetData,
  calculateAnnualSpent,
  calculateThemeSpent,
  countAnnualItems,
  countThemeItems
} from '../utils/budgetCalculations';

/**
 * Hook principal pour récupérer tous les budgets d'un utilisateur
 * NOUVEAUTÉ : Les budgets auto sont calculés dynamiquement (pas en BDD)
 */
export function useBudget(userId: string) {
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const currentYear = new Date().getFullYear();

      // 1️⃣ Récupérer les claims (in-app) - ✅ Ajouter original_theme
      const { data: claims, error: claimsError } = await supabase
        .from('claims')
        .select(`
          *,
          items!inner(
            price,
            original_theme,
            wishlists(
              theme,
              profiles!wishlists_owner_id_fkey!inner(display_name)
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'réservé');

      if (claimsError) throw claimsError;

      // 2️⃣ Récupérer les external_gifts (hors-app)
      const { data: externalGifts, error: giftsError } = await supabase
        .from('external_gifts')
        .select('*')
        .eq('user_id', userId);

      if (giftsError) throw giftsError;

      // 3️⃣ CRÉER LES BUDGETS AUTO DYNAMIQUEMENT (pas en BDD)
      const autoBudgetTypes: Array<{
        type: 'annuel' | 'noël' | 'anniversaire' | 'naissance' | 'mariage' | 'autre';
        year: number;
        name: string;
      }> = [
        { type: 'annuel', year: currentYear, name: `Annuel ${currentYear}` },
        { type: 'noël', year: currentYear - 1, name: `Noël ${currentYear - 1}` },
        { type: 'noël', year: currentYear, name: `Noël ${currentYear}` },
        { type: 'anniversaire', year: currentYear, name: `Anniversaire ${currentYear}` },
        { type: 'naissance', year: currentYear, name: `Naissance ${currentYear}` },
        { type: 'mariage', year: currentYear, name: `Mariage ${currentYear}` },
        { type: 'autre', year: currentYear, name: `Autre ${currentYear}` }
      ];

      const autoBudgets: BudgetData[] = autoBudgetTypes.map(({ type, year, name }) => {
        let spent = 0;
        let itemsCount = 0;

        if (type === 'annuel') {
          spent = calculateAnnualSpent(claims || [], externalGifts || [], year);
          itemsCount = countAnnualItems(claims || [], externalGifts || [], year);
        } else {
          spent = calculateThemeSpent(claims || [], externalGifts || [], type, year);
          itemsCount = countThemeItems(claims || [], externalGifts || [], type, year);
        }

        const virtualGoal: BudgetGoal = {
          id: `auto-${type}-${year}`,
          user_id: userId,
          name,
          type,
          year,
          limit_amount: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        return enrichBudgetData(virtualGoal, spent, itemsCount);
      }).filter(b => b.itemsCount > 0);

      // 4️⃣ Récupérer les budgets personnalisés (en BDD)
      const { data: customBudgets, error: customError } = await supabase
        .from('budget_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'personnalisé');

      if (customError) throw customError;

      const customBudgetsData: BudgetData[] = customBudgets?.map(goal =>
        enrichBudgetData(goal, 0, 0)
      ) || [];

      // 5️⃣ Fusionner auto + custom
      const allBudgets = [...autoBudgets, ...customBudgetsData];

      setBudgets(allBudgets);
    } catch (err: any) {
      console.error('Erreur useBudget:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [userId]);

  return { budgets, loading, error, refetch };
}

/**
 * Hook pour données du donut (par personne/thème/liste)
 * ✅ MODIFIÉ : Ajoute original_theme dans la requête
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
    if (!userId) return;

    async function fetchData() {
      try {
        setLoading(true);

        // Récupérer claims avec détails + original_theme
        const { data: claims, error: claimsError } = await supabase
          .from('claims')
          .select(`
            id,
            reserved_at,
            created_at,
            paid_amount,
            items!inner(
              title,
              price,
              original_theme,
              wishlists(
                owner_id,
                theme,
                name,
                profiles!wishlists_owner_id_fkey!inner(display_name)
              )
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'réservé');

        if (claimsError) {
          console.error('❌ Erreur claims:', claimsError);
        }

        // Récupérer external_gifts avec détails
        const { data: externalGifts, error: giftsError } = await supabase
          .from('external_gifts')
          .select(`
            id,
            purchase_date,
            paid_amount,
            description,
            theme,
            external_recipients!inner(
              name,
              profile_id,
              profiles!external_recipients_profile_id_fkey(display_name)
            )
          `)
          .eq('user_id', userId);

        if (giftsError) {
          console.error('❌ Erreur external_gifts:', giftsError);
        }

        console.log('🔍 Claims récupérés:', claims?.length, claims);
        console.log('🔍 External gifts récupérés:', externalGifts?.length, externalGifts);

        // Grouper selon viewMode
        const grouped = new Map<string, number>();
        const itemsByCategory = new Map<string, Array<{ title: string; price: number }>>();

        if (viewMode === 'global' || viewMode === 'theme') {
          // Vue globale/thème - ✅ Utiliser original_theme en fallback
          claims?.forEach((claim: any) => {
            const claimDate = claim.reserved_at || claim.created_at;
            if (!claimDate) return;
            const claimYear = new Date(claimDate).getFullYear();
            if (claimYear !== year) return;

            const theme = claim.items?.wishlists?.theme || claim.items?.original_theme || 'autre';
            const amount = claim.paid_amount || claim.items?.price || 0;
            const title = claim.items?.title || 'Cadeau sans titre';

            grouped.set(theme, (grouped.get(theme) || 0) + amount);

            if (!itemsByCategory.has(theme)) {
              itemsByCategory.set(theme, []);
            }
            itemsByCategory.get(theme)?.push({ title, price: amount });

            console.log(`✅ Ajouté à ${theme}:`, title, amount);
          });

          externalGifts?.forEach((gift: any) => {
            const giftYear = new Date(gift.purchase_date).getFullYear();
            if (giftYear !== year) return;

            const theme = gift.theme || 'autre';
            const title = gift.description || 'Cadeau hors-app';
            const amount = gift.paid_amount;

            grouped.set(theme, (grouped.get(theme) || 0) + amount);

            if (!itemsByCategory.has(theme)) {
              itemsByCategory.set(theme, []);
            }
            itemsByCategory.get(theme)?.push({ title, price: amount });

            console.log(`✅ Ajouté external à ${theme}:`, title, amount);
          });

        } else if (viewMode === 'person') {
          // Vue par personne
          claims?.forEach((claim: any) => {
            const claimDate = claim.reserved_at || claim.created_at;
            if (!claimDate) return;
            const claimYear = new Date(claimDate).getFullYear();
            if (claimYear !== year) return;

            const personName = claim.items?.wishlists?.profiles?.display_name || 'Inconnu';
            const amount = claim.paid_amount || claim.items?.price || 0;
            const title = claim.items?.title || 'Cadeau sans titre';

            grouped.set(personName, (grouped.get(personName) || 0) + amount);

            if (!itemsByCategory.has(personName)) {
              itemsByCategory.set(personName, []);
            }
            itemsByCategory.get(personName)?.push({ title, price: amount });
          });

          externalGifts?.forEach((gift: any) => {
            const giftYear = new Date(gift.purchase_date).getFullYear();
            if (giftYear !== year) return;

            const personName = gift.external_recipients?.profiles?.display_name
              || gift.external_recipients?.name
              || 'Inconnu';
            const title = gift.description || 'Cadeau hors-app';
            const amount = gift.paid_amount;

            grouped.set(personName, (grouped.get(personName) || 0) + amount);

            if (!itemsByCategory.has(personName)) {
              itemsByCategory.set(personName, []);
            }
            itemsByCategory.get(personName)?.push({ title, price: amount });
          });

        } else if (viewMode === 'list') {
          // Vue par liste
          claims?.forEach((claim: any) => {
            const claimDate = claim.reserved_at || claim.created_at;
            if (!claimDate) return;
            const claimYear = new Date(claimDate).getFullYear();
            if (claimYear !== year) return;

            const listName = claim.items?.wishlists?.name || 'Hors liste';
            const amount = claim.paid_amount || claim.items?.price || 0;
            const title = claim.items?.title || 'Cadeau sans titre';

            grouped.set(listName, (grouped.get(listName) || 0) + amount);

            if (!itemsByCategory.has(listName)) {
              itemsByCategory.set(listName, []);
            }
            itemsByCategory.get(listName)?.push({ title, price: amount });
          });

          // External gifts → Hors liste
          externalGifts?.forEach((gift: any) => {
            const giftYear = new Date(gift.purchase_date).getFullYear();
            if (giftYear !== year) return;

            const title = gift.description || 'Cadeau hors-app';
            const amount = gift.paid_amount;

            grouped.set('Hors liste', (grouped.get('Hors liste') || 0) + amount);

            if (!itemsByCategory.has('Hors liste')) {
              itemsByCategory.set('Hors liste', []);
            }
            itemsByCategory.get('Hors liste')?.push({ title, price: amount });
          });
        }

        console.log('🔍 itemsByCategory:', Array.from(itemsByCategory.entries()));

        const total = Array.from(grouped.values()).reduce((sum, val) => sum + val, 0);

        if (total === 0) {
          setData([]);
          return;
        }

        const DONUT_COLORS = [
          '#8B5CF6', '#EC4899', '#3B82F6', '#A855F7',
          '#F472B6', '#60A5FA', '#7C3AED', '#DB2777',
          '#2563EB', '#C084FC',
        ];

        const result = Array.from(grouped.entries())
          .map(([name, value], index) => {
            const items = itemsByCategory.get(name) || [];
            console.log(`🔍 Items pour ${name}:`, items);

            return {
              name,
              value: Math.round(value * 100) / 100,
              percentage: Math.round((value / total) * 100),
              color: DONUT_COLORS[index % DONUT_COLORS.length],
              items
            };
          })
          .sort((a, b) => b.value - a.value);

        console.log('✅ Résultat final:', result);
        setData(result);
      } catch (err) {
        console.error('❌ Erreur useBudgetDonutData:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, viewMode, year]);

  return { data, loading };
}
