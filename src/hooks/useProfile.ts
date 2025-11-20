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
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: wishlistsData } = await supabase
        .from('wishlists')
        .select('*, items (*)')
        .eq('owner_id', userId);

      const { data: claimsData } = await supabase
        .from('claims')
        .select('*, items (name, wishlists (name))')
        .eq('user_id', userId);

      const { data: budgetsData } = await supabase
        .from('budget_goals')
        .select('*')
        .eq('user_id', userId);

      const exportData = {
        profile: profileData,
        wishlists: wishlistsData,
        claims: claimsData,
        budgets: budgetsData,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

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
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          deleted_at: new Date().toISOString(),
          username: `deleted_${userId.slice(0, 8)}`,
          display_name: null,
          bio: null,
          avatar_url: null,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

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
