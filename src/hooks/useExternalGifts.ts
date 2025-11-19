/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/hooks/useExternalGifts.ts
// 🧠 Rôle : Hook pour gérer les cadeaux hors-app

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { ExternalGift, ExternalRecipient } from '../types/db';

/**
 * Hook pour récupérer tous les cadeaux hors-app d'un utilisateur
 */
export function useExternalGifts(userId: string) {
  const [gifts, setGifts] = useState<ExternalGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchGifts() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('external_gifts')
          .select(`
            *,
            external_recipients!inner(
              id,
              name,
              profile_id,
              profiles(display_name)
            )
          `)
          .eq('user_id', userId)
          .order('purchase_date', { ascending: false });

        if (fetchError) throw fetchError;
        setGifts(data || []);
      } catch (err: any) {
        console.error('Erreur useExternalGifts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchGifts();
  }, [userId]);

  return { gifts, loading, error };
}

/**
 * Hook pour récupérer tous les destinataires hors-app d'un utilisateur
 */
export function useExternalRecipients(userId: string) {
  const [recipients, setRecipients] = useState<ExternalRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('external_recipients')
        .select(`
          *,
          profiles:profile_id(display_name),
          external_gifts(id)
        `)
        .eq('user_id', userId)
        .order('name');

      if (fetchError) throw fetchError;
      setRecipients(data || []);
    } catch (err: any) {
      console.error('Erreur useExternalRecipients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    reload();
  }, [userId]);

  return { recipients, loading, error, reload };
}

/**
 * Ajouter un cadeau hors-app
 */
export async function addExternalGift(
  userId: string,
  recipientId: string,
  data: {
    description?: string;
    paid_amount: number;
    purchase_date: string;
    theme: string;
    notes?: string;
  }
) {
  const { error } = await supabase
    .from('external_gifts')
    .insert({
      user_id: userId,
      recipient_id: recipientId,
      ...data
    });

  if (error) throw error;
}

/**
 * Supprimer un cadeau hors-app
 */
export async function deleteExternalGift(giftId: string) {
  const { error } = await supabase
    .from('external_gifts')
    .delete()
    .eq('id', giftId);

  if (error) throw error;
}

/**
 * Ajouter un destinataire hors-app
 */
export async function addExternalRecipient(userId: string, name: string) {
  const { data, error } = await supabase
    .from('external_recipients')
    .insert({
      user_id: userId,
      name: name.trim()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Supprimer un destinataire hors-app
 */
export async function deleteExternalRecipient(recipientId: string) {
  const { error } = await supabase
    .from('external_recipients')
    .delete()
    .eq('id', recipientId);

  if (error) throw error;
}

/**
 * Lier un destinataire hors-app à un profil WishLists
 */
export async function linkRecipientToProfile(recipientId: string, profileId: string) {
  const { error } = await supabase
    .from('external_recipients')
    .update({ profile_id: profileId })
    .eq('id', recipientId);

  if (error) throw error;
}
