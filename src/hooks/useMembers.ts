/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 useMembers.ts
// 🧠 Rôle : Hook pour gérer les membres d'une wishlist (CRUD) avec notifications
// 🔧 Fix : Suppression avec clé composite (user_id + wishlist_id)

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createNotification } from './useNotifications';

// ⚙️ Types
export interface WishlistMember {
  id: string;
  wishlist_id: string;
  user_id: string;
  role: 'owner' | 'viewer';
  status: 'pending' | 'accepted';
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
        .order('joined_at', { ascending: true, nullsFirst: false });

      if (fetchError) throw fetchError;

      console.log('🔍 useMembers → wishlistId =', wishlistId, 'rows =', data);

      const normalized =
        (data || []).map((row: any) => ({
          ...row,
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
  const removeMember = async (userId: string) => {
    if (!wishlistId) throw new Error('wishlistId manquant');

    console.log('🗑️ removeMember → userId =', userId, 'wishlistId =', wishlistId);

    try {
      // 1) Récupérer les infos du membre avant suppression
      const { data: member } = await supabase
        .from('wishlist_members')
        .select('user_id, wishlist_id, profiles(username, display_name)')
        .eq('user_id', userId) // ⬅️ FIX : user_id
        .eq('wishlist_id', wishlistId) // ⬅️ FIX : wishlist_id
        .single();

      if (!member) {
        throw new Error('Membre introuvable');
      }

      // 2) Récupérer les infos de la wishlist
      const { data: wishlist } = await supabase
        .from('wishlists')
        .select('name')
        .eq('id', wishlistId)
        .single();

      // 3) Supprimer le membre (clé composite)
      const { error } = await supabase
        .from('wishlist_members')
        .delete()
        .eq('user_id', userId) // ⬅️ FIX : user_id
        .eq('wishlist_id', wishlistId); // ⬅️ FIX : wishlist_id

      if (error) throw error;

      // 4) 🔔 CRÉER UNE NOTIFICATION
      if (wishlist) {
        await createNotification({
          userId: member.user_id,
          type: 'acces_refuse',
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
    } catch (err) {
      console.error('❌ removeMember → Erreur:', err);
      throw err;
    }
  };

  // 🔄 Changer le rôle (owner → viewer ou inverse)
  const updateRole = async (userId: string, newRole: 'owner' | 'viewer') => {
    if (!wishlistId) throw new Error('wishlistId manquant');

    const { error } = await supabase
      .from('wishlist_members')
      .update({ role: newRole })
      .eq('user_id', userId)
      .eq('wishlist_id', wishlistId);

    if (error) throw error;

    await fetchMembers();
  };

  // ✅ Accepter une demande d'accès
  const acceptMember = async (userId: string) => {
    if (!wishlistId) throw new Error('wishlistId manquant');

    console.log('✅ acceptMember → userId =', userId, 'wishlistId =', wishlistId);

    const { error } = await supabase
      .from('wishlist_members')
      .update({ status: 'accepted' })
      .eq('user_id', userId)
      .eq('wishlist_id', wishlistId);

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
