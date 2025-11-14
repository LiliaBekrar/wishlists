/* eslint-disable react-hooks/exhaustive-deps */
// 📄 src/hooks/useItems.ts
// 🧠 Rôle : Hook pour gérer les items (cadeaux) d'une liste
// 🛠️ Auteur : Claude IA pour WishLists v7

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Item {
  id: string;
  wishlist_id: string | null; // ⬅️ Peut être NULL (items orphelins)
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
  // ⬅️ Colonnes pour items orphelins
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
          title: input.name.trim(), // ⬅️ input.name → column title
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
      // ⬅️ Vérifier si l'item est réservé
      const { data: claims } = await supabase
        .from('claims')
        .select('id')
        .eq('item_id', id)
        .eq('status', 'réservé');

      if (claims && claims.length > 0) {
        throw new Error('⚠️ Ce cadeau est réservé ! Demande au membre d\'annuler sa réservation avant de le supprimer.');
      }

      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      console.log('✅ Item supprimé');
      await fetchItems();
    } catch (err) {
      console.error('❌ Erreur suppression item:', err);
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
