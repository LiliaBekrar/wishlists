/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/hooks/useNotifications.ts
// 🧠 Rôle : Hook pour gérer les notifications utilisateur
// 🛠️ Auteur : Claude IA pour WishLists v7

import { supabase } from '../lib/supabaseClient';

// ⬅️ TYPES DE NOTIFICATIONS
export type NotificationType =
  | 'invitation_liste'
  | 'demande_acces'
  | 'acces_accorde'
  | 'acces_refuse'
  | 'reservation_cadeau'   // ⬅️ Quand quelqu'un réserve un cadeau
  | 'liberation_cadeau';   // ⬅️ Quand un cadeau redevient disponible

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
  try {
    // Vérifier si l'utilisateur a activé les notifications
    const { data: profile } = await supabase
      .from('profiles')
      .select('notifications_enabled')
      .eq('id', userId)
      .single();

    if (!profile?.notifications_enabled) {
      console.log('⏭️ Notifications désactivées pour cet utilisateur', { userId });
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
      console.error('❌ Erreur création notification:', {
        message: (error as any).message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      });
      return null;
    }

    console.log('✅ Notification créée:', notification);
    return notification as Notification;
  } catch (error) {
    console.error('❌ Erreur création notification (exception):', error);
    return null;
  }
}

/**
 * ⭐ NOUVEAU : Notifier tous les membres actifs d'une liste (sauf owner et sauf excluIds)
 *
 * @param wishlistId - ID de la liste concernée
 * @param type - Type de notification
 * @param title - Titre de la notification
 * @param message - Message de la notification
 * @param data - Données supplémentaires (doit contenir wishlistSlug et itemName)
 * @param excludeUserIds - IDs d'utilisateurs à ne PAS notifier (ex: celui qui réserve)
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
  try {
    // 1️⃣ Récupérer l'owner de la liste
    const { data: wishlist } = await supabase
      .from('wishlists')
      .select('user_id')
      .eq('id', wishlistId)
      .single();

    if (!wishlist) {
      console.error('❌ Liste introuvable:', wishlistId);
      return;
    }

    // 2️⃣ Récupérer tous les membres actifs (sauf owner et excludeUserIds)
    const { data: members } = await supabase
      .from('wishlist_members')
      .select('user_id')
      .eq('wishlist_id', wishlistId)
      .eq('status', 'actif')
      .neq('user_id', wishlist.user_id) // ⬅️ Exclure l'owner
      .not('user_id', 'in', `(${excludeUserIds.join(',')})`); // ⬅️ Exclure les IDs spécifiés

    if (!members || members.length === 0) {
      console.log('⏭️ Aucun membre à notifier sur cette liste');
      return;
    }

    // 3️⃣ Créer une notification pour chaque membre
    const notifications = members.map((member) =>
      createNotification({
        userId: member.user_id,
        type,
        title,
        message,
        data,
      })
    );

    await Promise.all(notifications);
    console.log(`✅ ${members.length} membre(s) notifié(s)`);
  } catch (error) {
    console.error('❌ Erreur notification membres:', error);
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
