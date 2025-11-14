/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/hooks/useNotifications.ts
// 🧠 Rôle : Hook pour gérer les notifications utilisateur

import { supabase } from '../lib/supabaseClient';

// ⬅️ TYPES DE NOTIFICATIONS
export type NotificationType =
  | 'invitation_liste'
  | 'demande_acces'
  | 'acces_accorde'
  | 'acces_refuse'
  | 'reservation_cadeau'
  | 'liberation_cadeau';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  read_at?: string;
  created_at: string;
  action_taken?: 'accepted' | 'rejected' | null;
  action_taken_at?: string | null;
}

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

/**
 * Créer une notification pour un utilisateur
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  data = {},
}: CreateNotificationParams): Promise<Notification | null> {
  console.log('🔔 [createNotification] Début', {
    userId,
    type,
    title,
  });

  try {
    // Vérifier si l'utilisateur a activé les notifications
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('notifications_enabled')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ [createNotification] Erreur récup profile:', profileError);
      return null;
    }

    console.log('📊 [createNotification] Profile trouvé:', {
      userId,
      notifications_enabled: profile?.notifications_enabled,
    });

    if (!profile?.notifications_enabled) {
      console.log('⏭️ [createNotification] Notifications désactivées pour:', userId);
      return null;
    }

    // Créer la notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [createNotification] Erreur INSERT:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    console.log('✅ [createNotification] Notification créée:', notification.id);
    return notification as Notification;
  } catch (error) {
    console.error('❌ [createNotification] Exception:', error);
    return null;
  }
}

/**
 * ⭐ Notifier tous les membres actifs d'une liste (sauf owner et sauf excluIds)
 */
export async function notifyAllMembers({
  wishlistId,
  type,
  title,
  message,
  data = {},
  excludeUserIds = [],
}: {
  wishlistId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  excludeUserIds?: string[];
}): Promise<void> {
  console.log('🔔 [notifyAllMembers] Début', {
    wishlistId,
    type,
    title,
    excludeUserIds,
  });

  try {
    // 1️⃣ Récupérer l'owner de la liste
    const { data: wishlist, error: wishlistError } = await supabase
      .from('wishlists')
      .select('owner_id')
      .eq('id', wishlistId)
      .single();

    if (wishlistError) {
      console.error('❌ [notifyAllMembers] Erreur récup wishlist:', wishlistError);
      return;
    }

    if (!wishlist) {
      console.error('❌ [notifyAllMembers] Liste introuvable:', wishlistId);
      return;
    }

    console.log('✅ [notifyAllMembers] Owner trouvé:', wishlist.owner_id);

    // 2️⃣ Récupérer tous les membres actifs
    const { data: members, error: membersError } = await supabase
      .from('wishlist_members')
      .select('user_id')
      .eq('wishlist_id', wishlistId)
      .eq('status', 'actif')
      .neq('user_id', wishlist.owner_id); // ⬅️ Exclure l'owner

    if (membersError) {
      console.error('❌ [notifyAllMembers] Erreur récup membres:', membersError);
      return;
    }

    console.log('📊 [notifyAllMembers] Membres actifs bruts:', members?.length, members);

    // ⬅️ Filtrer les excludeUserIds manuellement
    const filteredMembers = (members || []).filter(
      (member) => !excludeUserIds.includes(member.user_id)
    );

    console.log('📊 [notifyAllMembers] Membres après filtrage:', filteredMembers.length, filteredMembers);

    if (filteredMembers.length === 0) {
      console.log('⏭️ [notifyAllMembers] Aucun membre à notifier');
      return;
    }

    // 3️⃣ Créer une notification pour chaque membre
    const notifications = filteredMembers.map((member) => {
      console.log('📤 [notifyAllMembers] Création notif pour:', member.user_id);
      return createNotification({
        userId: member.user_id,
        type,
        title,
        message,
        data,
      });
    });

    await Promise.all(notifications);
    console.log(`✅ [notifyAllMembers] ${filteredMembers.length} membre(s) notifié(s)`);
  } catch (error) {
    console.error('❌ [notifyAllMembers] Exception:', error);
  }
}

/**
 * Marquer une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erreur marquage notification:', error);
  }
}

/**
 * Marquer toutes les notifications comme lues
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erreur marquage toutes notifications:', error);
  }
}

/**
 * Supprimer une notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erreur suppression notification:', error);
  }
}

/**
 * Récupérer les notifications d'un utilisateur
 */
export async function getNotifications(
  userId: string,
  limit = 50
): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    return [];
  }
}

/**
 * Archiver une notification (marquer action prise)
 */
export async function archiveNotification(
  notificationId: string,
  action: 'accepted' | 'rejected'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
        action_taken: action,
        action_taken_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erreur archivage notification:', error);
  }
}
