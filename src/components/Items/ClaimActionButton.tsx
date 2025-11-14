/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/components/ClaimActionButton.tsx
// 🧠 Rôle : Bouton réserver/annuler compact avec gestion intelligente
// 🛠️ Auteur : Claude IA pour WishLists v7

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
  onAction?: () => void;
}

export default function ClaimActionButton({
  item,
  wishlistId,
  isOwner,
  canClaim,
  compact = false,
  onAction,
}: ClaimActionButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [claimerId, setClaimerId] = useState<string | null>(null);
  const [claimLoaded, setClaimLoaded] = useState(false);

  // ⬅️ Charger qui a réservé ce cadeau (si réservé)
  useEffect(() => {
    if (item.status === 'réservé' && !claimLoaded) {
      supabase
        .from('claims')
        .select('user_id')
        .eq('item_id', item.id)
        .eq('status', 'réservé')
        .maybeSingle()
        .then(({ data }) => {
          setClaimerId(data?.user_id || null);
          setClaimLoaded(true);
        });
    }
  }, [item.id, item.status, claimLoaded]);

  // ⬅️ OWNER : uniquement bouton "Voir le produit" si URL existe
  if (isOwner) {
    return null; // ⬅️ Pas d'URL = rien à afficher
  }

  // ⬅️ Déterminer l'état
  const isMyReservation = claimerId === user?.id;
  const isReservedByOther = item.status === 'réservé' && !isMyReservation;

  // ⬅️ Handler réservation
  const handleReserve = async () => {
    if (!user) {
      alert('Connecte-toi pour réserver');
      return;
    }

    if (!canClaim) {
      alert('Tu dois rejoindre la liste pour réserver');
      return;
    }

    setLoading(true);

    try {
      const { error: claimError } = await supabase.from('claims').insert({
        item_id: item.id,
        user_id: user.id,
        status: 'réservé',
      });

      if (claimError) throw claimError;

      console.log('✅ Réservation réussie');
      onAction?.();
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Erreur réservation:', error);
      alert(error.message || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  // ⬅️ Handler annulation
  const handleCancel = async () => {
    if (!confirm('Annuler ta réservation ?')) {
      return;
    }

    setLoading(true);

    try {
      const { error: deleteError } = await supabase
        .from('claims')
        .delete()
        .eq('item_id', item.id)
        .eq('user_id', user!.id);

      if (deleteError) throw deleteError;

      console.log('✅ Réservation annulée');
      onAction?.();
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Erreur annulation:', error);
      alert(error.message || 'Erreur lors de l\'annulation');
    } finally {
      setLoading(false);
    }
  };

  // ⬅️ RENDU selon l'état
  if (item.status === 'disponible') {
    return (
      <button
        onClick={handleReserve}
        disabled={loading || !canClaim}
        className={`${compact ? 'w-full text-xs py-1.5 px-3' : 'flex-1 py-2 px-3 text-sm'} bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-all ${FOCUS_RING} disabled:cursor-not-allowed`}
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
        className={`${compact ? 'w-full text-xs py-1.5 px-3' : 'flex-1 py-2 px-3 text-sm'} bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-all ${FOCUS_RING}`}
        aria-label={`Annuler la réservation de ${item.title}`}
      >
        {loading ? '...' : '❌ Annuler'}
      </button>
    );
  }

  if (isReservedByOther) {
    return (
      <div className={`${compact ? 'w-full text-xs py-1.5 px-3' : 'flex-1 py-2 px-3 text-sm'} text-center bg-gray-100 text-gray-500 rounded-lg font-medium`}>
        Réservé
      </div>
    );
  }

  return null;
}
