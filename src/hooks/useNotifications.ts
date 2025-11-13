/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/hooks/useNotifications.ts
// 🧠 Rôle : Hook pour créer des notifications

import { supabase } from '../lib/supabaseClient';

export async function createNotification(params: {
  userId: string;
  type: 'invitation_liste' | 'demande_acces' | 'reservation_cadeau' | 'liberation_cadeau' | 'achat_cadeau';
  title: string;
  message: string;
  data?: any;
}) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
        read: false,
      });

    if (error) {
      console.error('❌ Erreur création notification:', error);
      throw error;
    }

    console.log('✅ Notification créée');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

export function useNotifications() {
  return { createNotification };
}
