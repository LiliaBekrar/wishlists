// 📄 useItems.ts
// 🧠 Rôle : Hook pour gérer les items (cadeaux) d'une liste
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Item {
  id: string;
  wishlist_id: string;
  title: string;
  note: string | null;
  url: string | null;
  image_url: string | null;
  price: number | null;
  price_cents: number | null;
  priority: 'basse' | 'moyenne' | 'haute';
  status: string;
  quantity: number;
  position: number;
  size: string | null;
  color: string | null;
  model: string | null;
  promo_code: string | null;
  created_at: string;
}

export function useItems(wishlistId: string | undefined) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les items
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

  // Créer un item
  const createItem = async (input: {
    name: string;
    description: string;
    url: string;
    price: number | null;
    priority: 'basse' | 'moyenne' | 'haute';
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
          price: input.price, // ⬅️ Seul le prix en euros suffit maintenant
          // price_cents sera calculé automatiquement par le trigger
          priority: input.priority,
          size: input.size.trim() || null,
          color: input.color.trim() || null,
          promo_code: input.promo_code.trim() || null,
          status: 'disponible',
          quantity: 1,
          position: items.length
        })
        .select()
        .single();

          if (insertError) {
            console.error('❌ Erreur Supabase:', { // ⬅️ AJOUTE plus de détails
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

  // Supprimer un item
  const deleteItem = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchItems();
    } catch (err) {
      console.error('❌ Erreur suppression item:', err);
      throw err;
    }
  };

  // Charger au montage
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
