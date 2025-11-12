// 📄 useWishlists.ts
// 🧠 Rôle : Hook pour gérer les wishlists (CRUD)
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { ThemeType } from '../utils/constants';

type VisibilityType = 'privée' | 'partagée' | 'publique';

export interface Wishlist {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  theme: ThemeType;
  visibility: VisibilityType;
  slug: string;
  created_at: string;
  updated_at: string;
}

export function useWishlists() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les listes de l'utilisateur
  const fetchWishlists = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('ℹ️ Pas d\'utilisateur connecté');
        setWishlists([]);
        return;
      }

      console.log('🔵 Chargement wishlists pour user:', user.id);

      const { data, error: fetchError } = await supabase
        .from('wishlists')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Erreur fetch:', fetchError);
        throw fetchError;
      }

      console.log('✅ Wishlists chargées:', data);
      setWishlists(data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Erreur chargement wishlists:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

// Créer une liste
const createWishlist = async (input: {
  name: string;
  description: string;
  theme: ThemeType;
  visibility: VisibilityType;
}) => {
  try {
    console.log('🔵 Début création wishlist:', input);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('❌ Erreur récupération user:', userError);
      throw new Error(`Erreur auth: ${userError.message}`);
    }

    if (!user) {
      throw new Error('Non authentifié');
    }

    console.log('✅ User authentifié:', user.id);

    // Plus besoin de mapping, on utilise directement les valeurs françaises
    const dataToInsert = {
      owner_id: user.id,
      name: input.name.trim(),
      description: input.description.trim() || null,
      theme: input.theme, // ⬅️ Directement la valeur
      visibility: input.visibility
    };

    console.log('🔵 Données à insérer:', dataToInsert);

    const { data, error: insertError } = await supabase
      .from('wishlists')
      .insert(dataToInsert)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur Supabase insert:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      throw new Error(`Erreur base de données: ${insertError.message}`);
    }

    console.log('✅ Liste créée avec succès:', data);

    await fetchWishlists();

    return data;
  } catch (err) {
    console.error('❌ Erreur création wishlist:', err);

    if (err instanceof Error) {
      console.error('Message:', err.message);
      console.error('Stack:', err.stack);
    }

    throw err;
  }
};

  // Mettre à jour une liste
  const updateWishlist = async (id: string, updates: Partial<Wishlist>) => {
    try {
      console.log('🔵 Update wishlist:', id, updates);

      const { error: updateError } = await supabase
        .from('wishlists')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error('❌ Erreur update:', updateError);
        throw updateError;
      }

      await fetchWishlists();
    } catch (err) {
      console.error('❌ Erreur update wishlist:', err);
      throw err;
    }
  };

  // Supprimer une liste
  const deleteWishlist = async (id: string) => {
    try {
      console.log('🔵 Delete wishlist:', id);

      const { error: deleteError } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('❌ Erreur delete:', deleteError);
        throw deleteError;
      }

      await fetchWishlists();
    } catch (err) {
      console.error('❌ Erreur suppression wishlist:', err);
      throw err;
    }
  };

  // Charger au montage
  useEffect(() => {
    fetchWishlists();
  }, []);

  return {
    wishlists,
    loading,
    error,
    fetchWishlists,
    createWishlist,
    updateWishlist,
    deleteWishlist
  };
}
