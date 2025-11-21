// 📄 src/hooks/useWishlists.ts
// 🧠 Rôle : Hook pour gérer les wishlists (CRUD + suppression avec orphelinage)

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
  updated_at: string | null;
}

export function useWishlists() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const dataToInsert = {
        owner_id: user.id,
        name: input.name.trim(),
        description: input.description.trim() || null,
        theme: input.theme,
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

  const updateWishlist = async (
    id: string,
    updates: {
      name: string;
      description: string;
      theme: ThemeType;
      visibility: VisibilityType;
    }
  ) => {
    try {
      console.log('🔵 Update wishlist - ID:', id);
      console.log('🔵 Update wishlist - Updates:', updates);

      const slug = updates.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      console.log('🔵 Slug généré:', slug);

      const dataToUpdate = {
        name: updates.name.trim(),
        description: updates.description.trim() || null,
        theme: updates.theme,
        visibility: updates.visibility,
        slug: slug,
      };

      console.log('🔵 Données à update:', dataToUpdate);

      const { data, error: updateError } = await supabase
        .from('wishlists')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erreur Supabase update:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
        throw new Error(`Erreur mise à jour: ${updateError.message}`);
      }

      console.log('✅ Liste mise à jour avec succès:', data);

      await fetchWishlists();

      return data;
    } catch (err) {
      console.error('❌ Erreur update wishlist complète:', err);

      if (err instanceof Error) {
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
      }

      throw err;
    }
  };

  // ⬅️ NOUVELLE LOGIQUE : Suppression avec orphelinage
  /**
   * Supprimer une liste :
   * - Items DISPONIBLES → supprimés
   * - Items RÉSERVÉS → orphelinés (wishlist_id = NULL)
   * - Membres → supprimés
   * - Claims → conservés
   */
  const deleteWishlist = async (id: string) => {
    try {
      console.log('🔵 Tentative suppression wishlist:', id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // 1️⃣ Récupérer infos de la liste
      const { data: wishlist, error: fetchError } = await supabase
        .from('wishlists')
        .select('owner_id, name, theme')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (wishlist.owner_id !== user.id) {
        throw new Error('Tu n\'es pas le propriétaire de cette liste');
      }

      // 2️⃣ Compter les items réservés
      const { data: reservedItems } = await supabase
        .from('items')
        .select('id, title')
        .eq('wishlist_id', id)
        .eq('status', 'réservé');

      const reservedCount = reservedItems?.length || 0;

      console.log(`📊 Items réservés trouvés: ${reservedCount}`);

      // 3️⃣ Message de confirmation adapté
      const confirmMessage = reservedCount > 0
        ? `Supprimer "${wishlist.name}" ?\n\n` +
          `⚠️ ${reservedCount} cadeau(x) réservé(s) :\n` +
          `• Les cadeaux réservés resteront visibles dans le dashboard des membres qui les ont réservés\n` +
          `• Les membres pourront toujours annuler leurs réservations\n` +
          `• Les cadeaux disponibles seront supprimés définitivement\n\n` +
          `Cette action est irréversible.`
        : `Supprimer définitivement "${wishlist.name}" ?\n\n` +
          `Cette action est irréversible.`;

      const confirm = window.confirm(confirmMessage);

      if (!confirm) {
        console.log('⏭️ Suppression annulée par l\'utilisateur');
        return { action: 'cancelled', message: 'Suppression annulée' };
      }

      // 4️⃣ Orpheliner les items réservés (conserver infos pour traçabilité)
      if (reservedCount > 0) {
        const { error: orphanError } = await supabase
          .from('items')
          .update({
            wishlist_id: null,
            original_wishlist_name: wishlist.name,
            original_owner_id: wishlist.owner_id,
            original_theme: wishlist.theme, // ⬅️ NOUVEAU : conserver le thème
          })
          .eq('wishlist_id', id)
          .eq('status', 'réservé');

        if (orphanError) {
          console.error('❌ Erreur orphelinage items:', orphanError);
          throw orphanError;
        }

        console.log(`✅ ${reservedCount} item(s) orpheliné(s)`);
      }

      // 5️⃣ Supprimer les items disponibles
      const { error: deleteItemsError } = await supabase
        .from('items')
        .delete()
        .eq('wishlist_id', id)
        .eq('status', 'disponible');

      if (deleteItemsError) {
        console.error('❌ Erreur suppression items dispo:', deleteItemsError);
        throw deleteItemsError;
      }

      console.log('✅ Items disponibles supprimés');

      // 6️⃣ Supprimer les membres
      const { error: deleteMembersError } = await supabase
        .from('wishlist_members')
        .delete()
        .eq('wishlist_id', id);

      if (deleteMembersError) {
        console.error('❌ Erreur suppression membres:', deleteMembersError);
        throw deleteMembersError;
      }

      console.log('✅ Membres supprimés');

      // 7️⃣ Supprimer la liste
      const { error: deleteError } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('❌ Erreur suppression liste:', deleteError);
        throw deleteError;
      }

      console.log('✅ Liste supprimée');
      await fetchWishlists();

      return {
        action: 'deleted',
        message: reservedCount > 0
          ? `✅ Liste supprimée (${reservedCount} cadeau(x) réservé(s) conservé(s))`
          : '✅ Liste supprimée définitivement',
      };
    } catch (err) {
      console.error('❌ Erreur suppression wishlist:', err);
      throw err;
    }
  };

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
