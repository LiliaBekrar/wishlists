/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/components/Items/ClaimActionButton.tsx
// 🧠 Rôle : Bouton réserver/annuler avec notifications aux membres

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { notifyAllMembers } from '../../hooks/useNotifications'; // ⬅️ IMPORTER
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
      // 1️⃣ Récupérer le slug de la wishlist pour la notification
      const { data: wishlist } = await supabase
        .from('wishlists')
        .select('slug, name')
        .eq('id', wishlistId)
        .single();

      // 2️⃣ Insérer le claim
      const { error: claimError } = await supabase
        .from('claims')
        .insert({
          item_id: item.id,
          user_id: user.id,
          status: 'réservé',
        });

      if (claimError) {
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

      // 3️⃣ Notifier tous les membres (sauf owner et sauf moi)
      if (wishlist) {
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
          excludeUserIds: [user.id], // ⬅️ Exclure celui qui réserve
        });

        console.log('✅ Notifications envoyées aux membres');
      }

      showToast({ message: '🎁 Cadeau réservé avec succès !', type: 'success' });
      onAction?.();
    } catch (error: any) {
      console.error('❌ Exception handleReserve:', error);
      showToast({
        message: error?.message || 'Erreur lors de la réservation',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;

    const confirmCancel = window.confirm('Annuler ta réservation ?');
    if (!confirmCancel) return;

    setLoading(true);

    try {
      // 1️⃣ Récupérer le slug de la wishlist pour la notification
      const { data: wishlist } = await supabase
        .from('wishlists')
        .select('slug, name')
        .eq('id', wishlistId)
        .single();

      // 2️⃣ Supprimer le claim
      const { error: deleteError } = await supabase
        .from('claims')
        .delete()
        .eq('item_id', item.id)
        .eq('user_id', user.id);

      if (deleteError) {
        showToast({
          message: deleteError.message || "Erreur lors de l'annulation",
          type: 'error',
        });
        return;
      }

      // 3️⃣ Notifier tous les membres (sauf owner et sauf moi)
      if (wishlist) {
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
          excludeUserIds: [user.id], // ⬅️ Exclure celui qui annule
        });

        console.log('✅ Notifications envoyées aux membres');
      }

      showToast({ message: '✅ Réservation annulée', type: 'success' });
      onAction?.();
    } catch (error: any) {
      console.error('❌ Exception handleCancel:', error);
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
