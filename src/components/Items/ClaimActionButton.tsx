/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/components/Items/ClaimActionButton.tsx
// 🧠 Rôle : Bouton réserver/annuler avec nettoyage auto des items archivés

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { notifyAllMembers } from '../../hooks/useNotifications';
import { FOCUS_RING } from '../../utils/constants';
import type { Item } from '../../hooks/useItems';

interface ClaimActionButtonProps {
  item: Item;
  wishlistId: string;
  isOwner: boolean;
  canClaim: boolean;
  compact?: boolean;
  onAction?: () => void;
  onToast?: (toast: { message: string; type: 'success' | 'error' }) => void;
}

export default function ClaimActionButton(props: ClaimActionButtonProps) {
  const {
    item,
    wishlistId,
    isOwner,
    canClaim,
    compact = false,
    onAction,
    onToast,
  } = props;

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [claimerId, setClaimerId] = useState<string | null>(null);
  const [claimLoaded, setClaimLoaded] = useState(false);

  const showToast = (toast: { message: string; type: 'success' | 'error' }) => {
    if (onToast) {
      onToast(toast);
    } else {
      if (toast.type === 'error') {
        console.error('❌ [ClaimActionButton toast fallback]', toast.message);
      } else {
        console.log('✅ [ClaimActionButton toast fallback]', toast.message);
      }
    }
  };

  useEffect(() => {
    if (item.status !== 'réservé') {
      setClaimerId(null);
      setClaimLoaded(true);
      return;
    }

    if (claimLoaded) return;

    supabase
      .from('claims')
      .select('user_id')
      .eq('item_id', item.id)
      .eq('status', 'réservé')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Erreur chargement claim:', error);
        }
        setClaimerId(data?.user_id || null);
        setClaimLoaded(true);
      });
  }, [item.id, item.status, claimLoaded]);

  if (isOwner) {
    return null;
  }

  const isMyReservation = claimerId === user?.id;
  const isReservedByOther = item.status === 'réservé' && !isMyReservation;

  const handleReserve = async () => {
    console.log('🔵 [handleReserve] Début', {
      wishlistId,
      itemId: item.id,
      userId: user?.id,
    });

    if (!user) {
      showToast({ message: 'Connecte-toi pour réserver', type: 'error' });
      return;
    }

    if (!canClaim) {
      showToast({ message: 'Tu dois rejoindre la liste pour réserver ce cadeau', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Récupérer le slug de la wishlist
      console.log('🔵 [handleReserve] Récupération wishlist...');
      const { data: wishlist, error: wishlistError } = await supabase
        .from('wishlists')
        .select('slug, name')
        .eq('id', wishlistId)
        .single();

      if (wishlistError) {
        console.error('❌ [handleReserve] Erreur récup wishlist:', wishlistError);
      } else {
        console.log('✅ [handleReserve] Wishlist trouvée:', wishlist);
      }

      // 2️⃣ Insérer le claim
      console.log('🔵 [handleReserve] Insertion claim...');
      const { error: claimError } = await supabase
        .from('claims')
        .insert({
          item_id: item.id,
          user_id: user.id,
          status: 'réservé',
        });

      if (claimError) {
        console.error('❌ [handleReserve] Erreur INSERT claim:', claimError);

        const pgCode = (claimError as any).code;
        const message = (claimError as any).message as string | undefined;

        if (pgCode === '23505' || (message && message.toLowerCase().includes('duplicate key'))) {
          showToast({
            message: 'Ce cadeau a déjà été réservé par quelqu\'un d\'autre.',
            type: 'error',
          });
          onAction?.();
          return;
        }

        showToast({
          message: message || 'Erreur lors de la réservation',
          type: 'error',
        });
        return;
      }

      console.log('✅ [handleReserve] Claim inséré');

      // 3️⃣ Notifier tous les membres (sauf owner et sauf moi)
      if (wishlist) {
        console.log('🔔 [handleReserve] Appel notifyAllMembers...');

        await notifyAllMembers({
          wishlistId,
          type: 'reservation_cadeau',
          title: '🎯 Cadeau réservé',
          message: `Quelqu'un a réservé "${item.title}" sur la liste "${wishlist.name}".`,
          data: {
            wishlistSlug: wishlist.slug,
            itemId: item.id,
            itemName: item.title,
          },
          excludeUserIds: [user.id],
        });

        console.log('✅ [handleReserve] notifyAllMembers terminé');
      } else {
        console.warn('⚠️ [handleReserve] Pas de wishlist, notifications non envoyées');
      }

      showToast({ message: '🎁 Cadeau réservé avec succès !', type: 'success' });
      onAction?.();
    } catch (error: any) {
      console.error('❌ [handleReserve] Exception:', error);
      showToast({
        message: error?.message || 'Erreur lors de la réservation',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    console.log('🔵 [handleCancel] Début', {
      wishlistId,
      itemId: item.id,
      userId: user?.id,
    });

    if (!user) return;

    // ⬅️ Vérifier si l'item est archivé
    const isArchived = item.wishlist_id === null && item.original_wishlist_name;

    const confirmMessage = isArchived
      ? `Ce cadeau a été retiré de la liste "${item.original_wishlist_name}".\n\nAnnuler ta réservation supprimera définitivement ce cadeau. Continuer ?`
      : 'Annuler ta réservation ?';

    const confirmCancel = window.confirm(confirmMessage);
    if (!confirmCancel) {
      console.log('⏭️ [handleCancel] Annulation refusée par utilisateur');
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Récupérer le slug de la wishlist (si pas archivé)
      let wishlist = null;
      if (!isArchived) {
        console.log('🔵 [handleCancel] Récupération wishlist...');
        const { data, error: wishlistError } = await supabase
          .from('wishlists')
          .select('slug, name')
          .eq('id', wishlistId)
          .single();

        if (wishlistError) {
          console.error('❌ [handleCancel] Erreur récup wishlist:', wishlistError);
        } else {
          wishlist = data;
          console.log('✅ [handleCancel] Wishlist trouvée:', wishlist);
        }
      }

      // 2️⃣ Supprimer le claim
      console.log('🔵 [handleCancel] Suppression claim...');
      const { error: deleteError } = await supabase
        .from('claims')
        .delete()
        .eq('item_id', item.id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('❌ [handleCancel] Erreur DELETE claim:', deleteError);
        showToast({
          message: deleteError.message || "Erreur lors de l'annulation",
          type: 'error',
        });
        return;
      }

      console.log('✅ [handleCancel] Claim supprimé');

      // 3️⃣ Si archivé → SUPPRIMER L'ITEM définitivement
      if (isArchived) {
        console.log('🗑️ [handleCancel] Item archivé → suppression définitive');

        // Vérifier qu'il n'y a plus d'autres claims actifs
        const { data: activeClaims, error: activeClaimsError } = await supabase
          .from('claims')
          .select('id')
          .eq('item_id', item.id)
          .eq('status', 'réservé');

        if (activeClaimsError) {
          console.error('❌ [handleCancel] Erreur check claims:', activeClaimsError);
        }

        if (!activeClaims || activeClaims.length === 0) {
          const { error: deleteItemError } = await supabase
            .from('items')
            .delete()
            .eq('id', item.id);

          if (deleteItemError) {
            console.error('❌ [handleCancel] Erreur DELETE item:', deleteItemError);
          } else {
            console.log('✅ [handleCancel] Item archivé supprimé définitivement');
          }
        } else {
          console.log('⚠️ [handleCancel] D\'autres claims existent, item conservé');
        }
      }

      // 4️⃣ Notifier tous les membres (sauf si archivé)
      if (wishlist) {
        console.log('🔔 [handleCancel] Appel notifyAllMembers...');

        await notifyAllMembers({
          wishlistId,
          type: 'liberation_cadeau',
          title: '🔓 Cadeau disponible',
          message: `"${item.title}" est de nouveau disponible sur la liste "${wishlist.name}".`,
          data: {
            wishlistSlug: wishlist.slug,
            itemId: item.id,
            itemName: item.title,
          },
          excludeUserIds: [user.id],
        });

        console.log('✅ [handleCancel] notifyAllMembers terminé');
      } else {
        console.log('⏭️ [handleCancel] Item archivé, pas de notification');
      }

      showToast({ message: '✅ Réservation annulée', type: 'success' });
      onAction?.();
    } catch (error: any) {
      console.error('❌ [handleCancel] Exception:', error);
      showToast({
        message: error?.message || "Erreur lors de l'annulation",
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (item.status === 'disponible') {
    return (
      <button
        onClick={handleReserve}
        disabled={loading || !canClaim}
        className={`${
          compact ? 'w-full text-xs py-1.5 px-3' : 'flex-1 py-2 px-3 text-sm'
        } bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-all ${FOCUS_RING} disabled:cursor-not-allowed`}
        aria-label={`Réserver ${item.title}`}
      >
        {loading ? '...' : '🎁 Réserver'}
      </button>
    );
  }

  if (isMyReservation) {
    return (
      <button
        onClick={handleCancel}
        disabled={loading}
        className={`${
          compact ? 'w-full text-xs py-1.5 px-3' : 'flex-1 py-2 px-3 text-sm'
        } bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-all ${FOCUS_RING}`}
        aria-label={`Annuler la réservation de ${item.title}`}
      >
        {loading ? '...' : '❌ Annuler'}
      </button>
    );
  }

  if (isReservedByOther) {
    return (
      <div
        className={`${
          compact ? 'w-full text-xs py-1.5 px-3' : 'flex-1 py-2 px-3 text-sm'
        } text-center bg-gray-100 text-gray-500 rounded-lg font-medium`}
      >
        Réservé
      </div>
    );
  }

  return null;
}
