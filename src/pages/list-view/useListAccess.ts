/* eslint-disable react-hooks/exhaustive-deps */
// 📄 src/pages/list-view/useListAccess.ts
// 🧠 Rôle : Gérer la logique d'accès aux listes (vérification + demande)

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { createNotification } from '../../hooks/useNotifications';
import type { Wishlist } from '../../hooks/useWishlists';

export type AccessStatus = 'checking' | 'granted' | 'denied' | 'pending' | 'guest';

interface UseListAccessReturn {
  accessStatus: AccessStatus;
  requestSending: boolean;
  handleRequestAccess: () => Promise<void>;
  refreshAccess: () => Promise<void>;
}

export function useListAccess(
  wishlist: Wishlist | null,
  userId: string | undefined
): UseListAccessReturn {
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('checking');
  const [requestSending, setRequestSending] = useState(false);

  // ⬅️ Fonction pour vérifier l'accès (réutilisable)
  const checkAccess = async () => {
    if (!wishlist) {
      setAccessStatus('checking');
      return;
    }

    // Si pas connecté
    if (!userId) {
      // ⬅️ FIX : Partagée = denied si pas connecté
      if (wishlist.visibility === 'publique') {
        setAccessStatus('guest');
      } else {
        setAccessStatus('denied');
      }
      return;
    }

    // Si owner
    if (userId === wishlist.owner_id) {
      setAccessStatus('granted');
      return;
    }

    // Vérifier si membre
    try {
      const { data: member, error } = await supabase
        .from('wishlist_members')
        .select('status, role')
        .eq('wishlist_id', wishlist.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Erreur vérification membre:', error);
        throw error;
      }

      // ⬅️ Si membre
      if (member) {
        if (member.status === 'actif') {
          setAccessStatus('granted');
        } else if (member.status === 'en_attente') {
          setAccessStatus('pending');
        } else {
          // Refusé ou quitté → guest si partagée/publique
          if (wishlist.visibility === 'publique' || wishlist.visibility === 'partagée') {
            setAccessStatus('guest');
          } else {
            setAccessStatus('denied');
          }
        }
      }
      // ⬅️ Pas membre
      else {
        // Publique → guest (peut voir et réserver)
        if (wishlist.visibility === 'publique') {
          setAccessStatus('guest');
        }
        // ⬅️ FIX : Partagée → guest (peut voir mais pas réserver)
        else if (wishlist.visibility === 'partagée') {
          setAccessStatus('guest');
        }
        // Privée → denied
        else {
          setAccessStatus('denied');
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification d\'accès:', error);
      setAccessStatus('denied');
    }
  };

  // Vérifier l'accès au montage et quand wishlist/userId change
  useEffect(() => {
    checkAccess();
  }, [wishlist?.id, userId]);

  // ⬅️ Fonction pour demander l'accès
  const handleRequestAccess = async () => {
    if (!userId || !wishlist) {
      throw new Error('Utilisateur ou liste manquant');
    }

    setRequestSending(true);

    try {
      // Vérifier qu'il n'y a pas déjà une demande
      const { data: existing } = await supabase
        .from('wishlist_members')
        .select('status, role')
        .eq('wishlist_id', wishlist.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'actif') {
          throw new Error('Tu es déjà membre de cette liste.');
        }
        if (existing.status === 'en_attente') {
          throw new Error('Ta demande est déjà en attente.');
        }
        console.log('📝 Nouvelle demande après refus/départ précédent');
      }

      // Récupérer l'email de l'utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, username, display_name')
        .eq('id', userId)
        .single();

      if (!profile?.email) {
        throw new Error('Email introuvable.');
      }

      // Nom à afficher dans la notification
      const requesterName =
        profile.display_name ||
        profile.username ||
        profile.email.split('@')[0];

      // ✅ 1) TENTER D'ENVOYER LA NOTIF AU PROPRIÉTAIRE
      const notif = await createNotification({
        userId: wishlist.owner_id,
        type: 'demande_acces',
        title: '🔔 Nouvelle demande d\'accès',
        message: `${requesterName} souhaite rejoindre ta liste "${wishlist.name}".`,
        data: {
          wishlistId: wishlist.id,
          wishlistSlug: wishlist.slug,
          requesterId: userId,
          requesterEmail: profile.email,
          requesterName,
        },
      });

      // ⛔ Si la notification n'est pas créée → on stoppe tout
      if (!notif) {
        throw new Error(
          'Impossible d\'envoyer la demande au propriétaire. Merci de réessayer plus tard.'
        );
      }

      // ✅ 2) SI LA NOTIF EST OK → on enregistre la demande dans wishlist_members
      const { error: upsertError } = await supabase
        .from('wishlist_members')
        .upsert(
          {
            wishlist_id: wishlist.id,
            user_id: userId,
            role: 'viewer',
            status: 'en_attente',
            requested_at: new Date().toISOString(),
          },
          {
            onConflict: 'wishlist_id,user_id',
          }
        );

      if (upsertError) {
        console.error('❌ Erreur upsert membre:', upsertError);
        throw upsertError;
      }

      console.log('✅ Demande d\'accès enregistrée');

      // ✅ Statut local
      setAccessStatus('pending');
    } catch (error) {
      console.error('❌ Erreur demande accès:', error);
      throw error;
    } finally {
      setRequestSending(false);
    }
  };

  return {
    accessStatus,
    requestSending,
    handleRequestAccess,
    refreshAccess: checkAccess,
  };
}
