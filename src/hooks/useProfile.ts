// 📄 src/hooks/useProfile.ts
// 🧠 Rôle : Gérer profil + export RGPD + suppression compte

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  total_wishlists: number;
  total_public_wishlists: number;
}

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const { count: totalCount } = await supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      const { count: publicCount } = await supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('visibility', 'publique');

      setProfile({
        ...profileData,
        total_wishlists: totalCount ?? 0,
        total_public_wishlists: publicCount ?? 0,
      });

      setError(null);
    } catch (err) {
      console.error('❌ Erreur chargement profil:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) throw new Error('User ID manquant');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;

    await fetchProfile();
  };

  const exportUserData = async () => {
    if (!userId) throw new Error('User ID manquant');

    try {
      // ✅ 1. Profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // ✅ 2. Listes avec items
      const { data: wishlistsData } = await supabase
        .from('wishlists')
        .select('*, items (*)')
        .eq('owner_id', userId);

      // ✅ 3. MES réservations (avec les bons noms de colonnes)
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select(`
          id,
          status,
          reserved_at,
          paid_amount,
          items (
            title,
            price,
            url,
            original_wishlist_name,
            wishlists (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .order('reserved_at', { ascending: false });

      if (claimsError) {
        console.error('❌ Erreur claims:', claimsError);
      }

      // ✅ 4. Budgets
      const { data: budgetsData } = await supabase
        .from('budget_goals')
        .select('*')
        .eq('user_id', userId);

      // ✅ 5. Construction export
      const exportData = {
        meta: {
          version: '2.0',
          exportDate: new Date().toISOString(),
          userId: userId,
        },
        profile: profileData,
        myWishlists: wishlistsData || [],
        myReservations: claimsData || [],
        budgets: budgetsData || [],
      };

      // ✅ 6. Téléchargement
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wishlists-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      console.error('❌ Erreur export:', err);
      throw err;
    }
  };

  const deleteAccount = async () => {
    if (!userId) throw new Error('User ID manquant');

    try {
      // 1️⃣ Supprimer le profil (le trigger SQL s'occupe du reste)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      // 2️⃣ Déconnecter l'utilisateur
      await supabase.auth.signOut();

      console.log('✅ Compte supprimé avec succès');
      return true;
    } catch (err) {
      console.error('❌ Erreur suppression compte:', err);
      throw err;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    exportUserData,
    deleteAccount,
    refetch: fetchProfile,
  };
}
