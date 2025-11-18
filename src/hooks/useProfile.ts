// 📄 src/hooks/useProfile.ts
// 🧠 Rôle : Gérer les données de profil utilisateur
// 🔧 Fix : Valeurs par défaut + slug unique

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  created_at: string;
  // Stats (toujours définies avec valeur par défaut)
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
      // Profil de base
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Compter les listes
      const { count: totalCount } = await supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      const { count: publicCount } = await supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('visibility', 'publique');

      // ⬅️ FIX : Valeurs par défaut garanties
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

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}
