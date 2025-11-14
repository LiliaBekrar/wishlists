/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/components/Items/ClaimActionButton.tsx
// 🧠 Rôle : Bouton réserver/annuler compact avec gestion intelligente + logs + toasts

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { FOCUS_RING } from '../../utils/constants';
import type { Item } from '../../hooks/useItems';

interface ClaimActionButtonProps {
  item: Item;
  wishlistId: string;
  isOwner: boolean;
  canClaim: boolean;
  compact?: boolean;
  onAction?: () => void; // ⬅️ pour refetch côté parent
  onToast?: (toast: { message: string; type: 'success' | 'error' }) => void; // ⬅️ pour afficher un Toast
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

  // 🧠 Helper pour Toast + fallback console si jamais onToast n'est pas passé
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

  // ⬅️ Charger qui a réservé ce cadeau (si réservé)
  useEffect(() => {
    console.log('[ClaimActionButton] useEffect item', item.id, 'status =', item.status);

    if (item.status !== 'réservé') {
      setClaimerId(null);
      setClaimLoaded(true);
      return;
    }

    if (claimLoaded) {
      console.log('[ClaimActionButton] claim déjà chargé pour item', item.id, 'claimerId =', claimerId);
      return;
    }

    console.log('[ClaimActionButton] chargement du claim pour item', item.id);

    supabase
      .from('claims')
      .select('user_id')
      .eq('item_id', item.id)
      .eq('status', 'réservé')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Erreur chargement claim (useEffect):', error);
        } else {
          console.log('[ClaimActionButton] claim trouvé pour item', item.id, '=> user_id =', data?.user_id);
        }
        setClaimerId(data?.user_id || null);
        setClaimLoaded(true);
      });
  }, [item.id, item.status, claimLoaded, claimerId]);

  // ⬅️ OWNER : pas de bouton réserver
  if (isOwner) {
    return null;
  }

  // ⬅️ Déterminer l'état
  const isMyReservation = claimerId === user?.id;
  const isReservedByOther = item.status === 'réservé' && !isMyReservation;

  // console.log('[ClaimActionButton] render', {
  //   itemId: item.id,
  //   status: item.status,
  //   claimerId,
  //   currentUserId: user?.id,
  //   isMyReservation,
  //   isReservedByOther,
  // });

  // ⬅️ Handler réservation
  const handleReserve = async () => {
    if (!user) {
      showToast({ message: 'Connecte-toi pour réserver', type: 'error' });
      return;
    }

    if (!canClaim) {
      showToast({ message: 'Tu dois rejoindre la liste pour réserver ce cadeau', type: 'error' });
      return;
    }

    console.log('[ClaimActionButton] handleReserve() pour item', item.id, 'par user', user.id);

    setLoading(true);

    try {
      console.log('[ClaimActionButton] INSERT into claims...', {
        item_id: item.id,
        user_id: user.id,
      });

      const { error: claimError } = await supabase
        .from('claims')
        .insert({
          item_id: item.id,
          user_id: user.id,
          status: 'réservé',
        });

      if (claimError) {
        console.error('❌ Erreur INSERT claim:', claimError);

        const pgCode = (claimError as any).code;
        const message = (claimError as any).message as string | undefined;

        // Contrainte unique → déjà réservé
        if (
          pgCode === '23505' ||
          (message && message.toLowerCase().includes('duplicate key'))
        ) {
          showToast({
            message: 'Ce cadeau a déjà été réservé par quelqu’un d’autre.',
            type: 'error',
          });
          onAction?.(); // ⬅️ refetch pour avoir l’état réel
          return;
        }

        showToast({
          message: message || 'Erreur lors de la réservation',
          type: 'error',
        });
        return;
      }

      // ✅ Ici, le trigger en BDD mettra `items.status = 'réservé'`
      showToast({ message: '🎁 Cadeau réservé avec succès !', type: 'success' });

      console.log('✅ Réservation réussie, onAction() (refetch items)');
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

  // ⬅️ Handler annulation
  const handleCancel = async () => {
    if (!user) return;

    const confirmCancel = window.confirm('Annuler ta réservation ?');
    if (!confirmCancel) {
      console.log('[ClaimActionButton] annulation refusée par l’utilisateur pour item', item.id);
      return;
    }

    console.log('[ClaimActionButton] handleCancel() pour item', item.id, 'par user', user.id);

    setLoading(true);

    try {
      console.log('[ClaimActionButton] DELETE FROM claims WHERE item_id = ?, user_id = ?', item.id, user.id);

      const { error: deleteError } = await supabase
        .from('claims')
        .delete()
        .eq('item_id', item.id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('❌ Erreur DELETE claim:', deleteError);
        showToast({
          message: deleteError.message || "Erreur lors de l'annulation",
          type: 'error',
        });
        return;
      }

      // ✅ Ici, le trigger en BDD remettra `items.status = 'disponible'`
      showToast({ message: '✅ Réservation annulée', type: 'success' });

      console.log('✅ Annulation réussie, onAction() (refetch items)');
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

  // ⬅️ Rendu selon l'état
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
