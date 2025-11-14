/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 useMembers.ts
// 🧠 Rôle : Hook pour gérer les membres d'une wishlist (CRUD) avec notifications

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createNotification } from './useNotifications';

// ⚙️ Types
export interface WishlistMember {
  id: string;
  wishlist_id: string;
  user_id: string;
  role: 'owner' | 'viewer';
  // En base tu as "pending" / "actif" → on normalise en 2 états simples
  status: 'pending' | 'accepted';
  // ta table n'a pas created_at, tu as plutôt requested_at / approved_at / joined_at
  joined_at?: string;
  requested_at?: string;
  approved_at?: string;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    email?: string;
  };
}

export function useMembers(wishlistId?: string) {
  const [members, setMembers] = useState<WishlistMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 📥 Charger les membres
  const fetchMembers = async () => {
    if (!wishlistId) {
      console.warn('useMembers appelé sans wishlistId');
      setMembers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('wishlist_members')
        .select(
          `
          *,
          profiles (
            username,
            display_name,
            avatar_url,
            email
          )
        `
        )
        .eq('wishlist_id', wishlistId)
        // 🔧 FIX: ta table n'a pas created_at → on trie sur joined_at qui existe
        .order('joined_at', { ascending: true });

      if (fetchError) throw fetchError;

      console.log('🔍 useMembers → wishlistId =', wishlistId, 'rows =', data);

      const normalized =
        (data || []).map((row: any) => ({
          ...row,
          // on convertit tout ce qui n'est pas "pending" en "accepted"
          status: row.status === 'pending' ? 'pending' : 'accepted',
        })) as WishlistMember[];

      setMembers(normalized);
    } catch (err) {
      console.error('❌ Erreur chargement membres:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Recharger au montage ou si wishlistId change
  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistId]);

  // ❌ Retirer un membre (avec notification)
  const removeMember = async (memberId: string) => {
    // 1) Récupérer les infos du membre avant suppression
    const { data: member } = await supabase
      .from('wishlist_members')
      .select('user_id, wishlist_id, profiles(username, display_name)')
      .eq('id', memberId)
      .single();

    if (!member) {
      throw new Error('Membre introuvable');
    }

    // 2) Récupérer les infos de la wishlist
    const { data: wishlist } = await supabase
      .from('wishlists')
      .select('name')
      .eq('id', member.wishlist_id)
      .single();

    // 3) Supprimer le membre
    const { error } = await supabase.from('wishlist_members').delete().eq('id', memberId);

    if (error) throw error;

    // 4) 🔔 CRÉER UNE NOTIFICATION
    if (wishlist) {
      await createNotification({
        userId: member.user_id,
        type: 'acces_refuse', // ou "member_removed" si tu crées ce type
        title: "👋 Retrait d'une liste",
        message: `Tu as été retiré(e) de la liste "${wishlist.name}"`,
        data: {
          wishlistId: member.wishlist_id,
          wishlistName: wishlist.name,
        },
      });
    }

    console.log('✅ Membre retiré et notifié');

    // 5) Recharger
    await fetchMembers();
  };

  // 🔄 Changer le rôle (owner → viewer ou inverse)
  const updateRole = async (memberId: string, newRole: 'owner' | 'viewer') => {
    const { error } = await supabase
      .from('wishlist_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) throw error;

    await fetchMembers();
  };

  // ✅ Accepter une demande d'accès
  const acceptMember = async (memberId: string) => {
    const { error } = await supabase
      .from('wishlist_members')
      .update({ status: 'accepted' })
      .eq('id', memberId);

    if (error) throw error;

    await fetchMembers();
  };

  return {
    members,
    loading,
    error,
    fetchMembers,
    removeMember,
    updateRole,
    acceptMember,
  };
}
