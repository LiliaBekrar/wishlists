/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 useMembers.ts
// 🧠 Rôle : Hook pour gérer les membres d'une wishlist (CRUD simplifié)

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createNotification } from './useNotifications';

export interface WishlistMember {
  id: string;
  wishlist_id: string;
  user_id: string;
  role: 'owner' | 'viewer';
  status: 'actif' | 'en_attente';
  joined_at?: string;
  requested_at?: string;
  approved_at?: string;
  profiles?: {
    username: string;
    display_name: string | null;
    email?: string;
  };
}

export function useMembers(wishlistId?: string) {
  const [members, setMembers] = useState<WishlistMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!wishlistId) {
      console.warn('⚠️ useMembers appelé sans wishlistId');
      setMembers([]);
      return;
    }

    console.log('🔄 [useMembers.fetchMembers] start pour wishlistId =', wishlistId);

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
            email
          )
        `
        )
        .eq('wishlist_id', wishlistId)
        .order('joined_at', { ascending: true, nullsFirst: false });

      console.log('📥 [useMembers.fetchMembers] résultat brut =', { data, fetchError });

      if (fetchError) throw fetchError;

      setMembers((data || []) as WishlistMember[]);
      console.log('✅ [useMembers.fetchMembers] membres chargés:', data?.length);
    } catch (err) {
      console.error('❌ [useMembers.fetchMembers] Erreur chargement membres:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🧷 [useMembers.useEffect] mount / wishlistId changé =', wishlistId);
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistId]);

  // ❌ Retirer un membre (DELETE)
  const removeMember = async (userId: string) => {
    if (!wishlistId) throw new Error('wishlistId manquant');

    console.log('🗑️ [useMembers.removeMember] userId =', userId, 'wishlistId =', wishlistId);

    try {
      // 1) Récupérer les infos avant suppression
      const { data: member } = await supabase
        .from('wishlist_members')
        .select('user_id, wishlist_id, profiles(username, display_name)')
        .eq('user_id', userId)
        .eq('wishlist_id', wishlistId)
        .single();

      const { data: wishlist } = await supabase
        .from('wishlists')
        .select('name')
        .eq('id', wishlistId)
        .single();

      // 2) DELETE
      const { error } = await supabase
        .from('wishlist_members')
        .delete()
        .eq('user_id', userId)
        .eq('wishlist_id', wishlistId);

      if (error) throw error;

      // 3) Notification
      if (wishlist && member) {
        await createNotification({
          userId: member.user_id,
          type: 'acces_refuse',
          title: "❌ Accès retiré",
          message: `Tu n'as plus accès à la liste "${wishlist.name}"`,
          data: {
            wishlistId: member.wishlist_id,
            wishlistName: wishlist.name,
          },
        });
      }

      console.log('✅ [removeMember] Membre supprimé et notifié');

      await fetchMembers();
    } catch (err) {
      console.error('❌ [removeMember] Erreur:', err);
      throw err;
    }
  };

  // 🚪 Quitter une liste (DELETE)
  const leaveMembership = async (userId: string) => {
    if (!wishlistId) throw new Error('wishlistId manquant');

    console.log('🚪 [useMembers.leaveMembership] userId =', userId, 'wishlistId =', wishlistId);

    try {
      // 1) Récupérer infos
      const { data: memberProfile } = await supabase
        .from('profiles')
        .select('username, display_name, email')
        .eq('id', userId)
        .single();

      const { data: wishlist } = await supabase
        .from('wishlists')
        .select('owner_id, name')
        .eq('id', wishlistId)
        .single();

      if (!wishlist) throw new Error('Liste introuvable');

      if (wishlist.owner_id === userId) {
        throw new Error('Le propriétaire ne peut pas quitter sa propre liste');
      }

      // 2) DELETE
      const { error: deleteError } = await supabase
        .from('wishlist_members')
        .delete()
        .eq('user_id', userId)
        .eq('wishlist_id', wishlistId);

      if (deleteError) throw deleteError;

      console.log('✅ [leaveMembership] Membre supprimé');

      // 3) Notification à l'owner
      const memberName =
        memberProfile?.display_name ||
        memberProfile?.username ||
        memberProfile?.email?.split('@')[0] ||
        'Un membre';

      const memberUsername = memberProfile?.username

      await createNotification({
        userId: wishlist.owner_id,
        type: 'acces_refuse',
        title: '👋 Un membre a quitté',
        message: `${memberName}(${memberUsername}) a quitté la liste "${wishlist.name}"`,
        data: {
          wishlistId,
          wishlistName: wishlist.name,
          memberUserId: userId,
          memberName,
        },
      });

      console.log('✅ [leaveMembership] Owner notifié');

      return { success: true };
    } catch (err) {
      console.error('❌ [leaveMembership] Erreur:', err);
      throw err;
    }
  };

  // 🔄 Changer le rôle
  const updateRole = async (userId: string, newRole: 'owner' | 'viewer') => {
    if (!wishlistId) throw new Error('wishlistId manquant');

    console.log('♻️ [updateRole] userId =', userId, 'newRole =', newRole);

    const { error } = await supabase
      .from('wishlist_members')
      .update({ role: newRole })
      .eq('user_id', userId)
      .eq('wishlist_id', wishlistId);

    if (error) throw error;

    await fetchMembers();
  };

  // ✅ Accepter une demande
  const acceptMember = async (userId: string) => {
    if (!wishlistId) throw new Error('wishlistId manquant');

    console.log('✅ [acceptMember] userId =', userId);

    const { error } = await supabase
      .from('wishlist_members')
      .update({ status: 'actif' })
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
    leaveMembership,
    updateRole,
    acceptMember,
  };
}
