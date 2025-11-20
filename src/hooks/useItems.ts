/* eslint-disable react-hooks/exhaustive-deps */
// 📄 src/hooks/useItems.ts
// 🧠 Rôle : Hook pour gérer les items avec archivage via fonction PostgreSQL

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createNotification } from './useNotifications';

export interface Item {
  id: string;
  wishlist_id: string | null;
  title: string;
  note: string | null;
  url: string | null;
  image_url: string | null;
  price: number;
  priority: 'basse' | 'moyenne' | 'haute';
  status: 'disponible' | 'réservé';
  quantity: number;
  position: number;
  size: string | null;
  color: string | null;
  model: string | null;
  promo_code: string | null;
  created_at: string;
  original_wishlist_name?: string | null;
  original_owner_id?: string | null;
}

export function useItems(wishlistId: string | undefined) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!wishlistId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔵 Chargement items pour wishlist:', wishlistId);

      const { data, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('wishlist_id', wishlistId)
        .not('wishlist_id', 'is', null)
        .order('position', { ascending: true });

      if (fetchError) throw fetchError;

      console.log('✅ Items chargés:', data);
      setItems(data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Erreur chargement items:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (input: {
    name: string;
    description: string;
    url: string;
    image_url: string;
    price: number;
    priority: 'basse' | 'moyenne' | 'haute';
    size: string;
    color: string;
    promo_code: string;
  }) => {
    if (!wishlistId) throw new Error('Wishlist ID manquant');

    try {
      console.log('🔵 Création item:', input);

      const { data, error: insertError } = await supabase
        .from('items')
        .insert({
          wishlist_id: wishlistId,
          title: input.name.trim(),
          note: input.description.trim() || null,
          url: input.url.trim() || null,
          image_url: input.image_url.trim() || null,
          price: input.price,
          priority: input.priority,
          size: input.size?.trim() || null,
          color: input.color?.trim() || null,
          promo_code: input.promo_code?.trim() || null,
          status: 'disponible',
          quantity: 1,
          position: items.length
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erreur Supabase:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw insertError;
      }

      console.log('✅ Item créé:', data);
      await fetchItems();
      return data;
    } catch (err) {
      console.error('❌ Erreur création item:', err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      console.log('🔵 [deleteItem] Début suppression item:', id);

      // 1️⃣ Vérifier si l'item est réservé
      const { data: claims, error: claimsError } = await supabase
        .from('claims')
        .select('id, user_id, status')
        .eq('item_id', id)
        .eq('status', 'réservé')
        .maybeSingle();

      if (claimsError) {
        console.error('❌ [deleteItem] Erreur récupération claims:', claimsError);
        throw claimsError;
      }

      console.log('📊 [deleteItem] Claims trouvés:', claims);

      // 2️⃣ Si réservé → ARCHIVER + NOTIFIER
      if (claims) {
        console.log('📦 [deleteItem] Item réservé → archivage via fonction PostgreSQL');

        // ⬅️ FIX : Récupérer item + wishlist séparément
        // Récupérer l'item
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select('title, wishlist_id')
          .eq('id', id)
          .single();

        if (itemError) {
          console.error('❌ [deleteItem] Erreur récupération item:', itemError);
          throw itemError;
        }

        if (!itemData.wishlist_id) {
          throw new Error('Item déjà archivé ou wishlist_id manquant');
        }

        console.log('📊 [deleteItem] Item récupéré:', itemData);

        // Récupérer la wishlist
        const { data: wishlistData, error: wishlistError } = await supabase
          .from('wishlists')
          .select('name, owner_id')
          .eq('id', itemData.wishlist_id)
          .single();

        if (wishlistError) {
          console.error('❌ [deleteItem] Erreur récupération wishlist:', wishlistError);
          throw wishlistError;
        }

        if (!wishlistData) {
          throw new Error('Wishlist introuvable');
        }

        console.log('📊 [deleteItem] Wishlist récupérée:', wishlistData);

        // ⭐ APPELER LA FONCTION POSTGRESQL (bypass RLS)
        console.log('🔧 [deleteItem] Appel fonction archive_reserved_item...');

        const { data: result, error: archiveError } = await supabase.rpc('archive_reserved_item', {
          p_item_id: id,
          p_original_wishlist_name: wishlistData.name,
          p_original_owner_id: wishlistData.owner_id,
        });

        if (archiveError) {
          console.error('❌ [deleteItem] Erreur fonction RPC:', {
            code: archiveError.code,
            message: archiveError.message,
            details: archiveError.details,
            hint: archiveError.hint,
          });
          throw archiveError;
        }

        console.log('✅ [deleteItem] Fonction RPC retournée:', result);

        // Notifier le membre
        console.log('🔔 [deleteItem] Envoi notification au membre:', claims.user_id);

        await createNotification({
          userId: claims.user_id,
          type: 'cadeau_supprime',
          title: '🗑️ Cadeau retiré de la liste',
          message: `Le cadeau "${itemData.title}" a été retiré de la liste "${wishlistData.name}" par son propriétaire. Tu peux annuler ta réservation si tu le souhaites.`,
          data: {
            itemId: id,
            itemName: itemData.title,
            claimId: claims.id,
            originalWishlistName: wishlistData.name,
          },
        });

        console.log('✅ [deleteItem] Item archivé + notification envoyée');
      }
      // 3️⃣ Si non réservé → SUPPRIMER
      else {
        console.log('🗑️ [deleteItem] Item non réservé → suppression définitive');

        const { error: deleteError } = await supabase
          .from('items')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('❌ [deleteItem] Erreur suppression:', deleteError);
          throw deleteError;
        }
        console.log('✅ [deleteItem] Item supprimé définitivement');
      }

      console.log('🔄 [deleteItem] Rafraîchissement de la liste...');
      await fetchItems();
      console.log('✅ [deleteItem] Suppression terminée avec succès');
    } catch (err) {
      console.error('❌ [deleteItem] Erreur suppression/archivage:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchItems();
  }, [wishlistId]);

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem,
    deleteItem
  };
}
