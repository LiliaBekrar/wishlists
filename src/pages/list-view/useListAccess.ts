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
      if (wishlist.visibility === 'privée') {
        setAccessStatus('denied');
      } else {
        setAccessStatus('guest');
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
        .select('status, approved, role, email') // ⬅️ FIX : Pas de 'id'
        .eq('wishlist_id', wishlist.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Erreur vérification membre:', error);
        throw error;
      }

      // ⬅️ LOGIQUE DE STATUT
      // Priorité 1 : Si approved = true → accès accordé
      if (member?.approved === true) {
        setAccessStatus('granted');
      }
      // Priorité 2 : Si status = 'en_attente' → en attente
      else if (member?.status === 'en_attente') {
        setAccessStatus('pending');
      }
      // Priorité 3 : Si status = 'refusé' → refusé (mais peut redemander ?)
      else if (member?.status === 'refusé') {
        setAccessStatus('denied');
      }
      // Pas membre
      else if (!member) {
        if (wishlist.visibility === 'privée' || wishlist.visibility === 'partagée') {
          setAccessStatus('denied');
        } else {
          setAccessStatus('guest');
        }
      }
      // Membre mais pas approved et pas de statut clair
      else {
        setAccessStatus('pending');
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
        .select('status, approved, role')
        .eq('wishlist_id', wishlist.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        if (existing.approved === true) {
          throw new Error('Tu es déjà membre de cette liste.');
        }
        if (existing.status === 'en_attente') {
          throw new Error('Ta demande est déjà en attente.');
        }
        if (existing.status === 'refusé') {
          console.log('📝 Mise à jour d\'une demande précédemment refusée');
        }
      }

      // Récupérer l'email de l'utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (!profile?.email) {
        throw new Error('Email introuvable.');
      }

      // ✅ 1) TENTER D'ENVOYER LA NOTIF AU PROPRIÉTAIRE
      const notif = await createNotification({
        userId: wishlist.owner_id,
        type: 'demande_acces',
        title: '🔔 Nouvelle demande d\'accès',
        message: `${profile.email} souhaite rejoindre ta liste "${wishlist.name}".`,
        data: {
          wishlistId: wishlist.id,
          wishlistSlug: wishlist.slug,
          requesterId: userId,
          requesterEmail: profile.email,
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
            email: profile.email,
            role: 'viewer',
            status: 'en_attente',
            approved: false,
            joined_via_link: false,
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

      // ✅ Statut local
      setAccessStatus('pending');
    } catch (error) {
      console.error('❌ Erreur demande accès:', error);
      throw error; // très important pour que la page affiche un toast d'erreur
    } finally {
      setRequestSending(false);
    }
  };

  return {
    accessStatus,
    requestSending,
    handleRequestAccess,
    refreshAccess: checkAccess, // ⬅️ Pour forcer un refresh
  };
}
