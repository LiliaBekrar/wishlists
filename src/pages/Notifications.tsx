/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/pages/Notifications.tsx
// 🧠 Rôle : Page notifications avec onglets et historique des actions

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { FOCUS_RING } from '../utils/constants';
import Toast from '../components/Toast';
import { createNotification } from '../hooks/useNotifications';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  action_taken?: 'accepted' | 'rejected' | null;
  action_taken_at?: string | null;
}

type TabType = 'unread' | 'all' | 'archived';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('unread');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchNotifications();

    // Subscription temps réel
    const channel = supabase
      .channel('notifications-page')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ Erreur chargement notifications:', error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (notifId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notifId);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', user!.id)
      .eq('read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setToast({ message: '✅ Toutes les notifications marquées comme lues', type: 'success' });
  };

  const deleteNotification = async (notifId: string) => {
    await supabase.from('notifications').delete().eq('id', notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    setToast({ message: '✅ Notification supprimée', type: 'success' });
  };

  const archiveNotification = async (notifId: string, action: 'accepted' | 'rejected') => {
    await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
        action_taken: action,
        action_taken_at: new Date().toISOString(),
      })
      .eq('id', notifId);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true, action_taken: action } : n))
    );
  };

  const handleAcceptInvitation = async (notif: Notification) => {
    try {
      const { wishlistId } = notif.data;

      const { error } = await supabase
        .from('wishlist_members')
        .update({
          status: 'actif',
          approved: true,
          approved_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        })
        .eq('wishlist_id', wishlistId)
        .eq('user_id', user!.id)
        .eq('status', 'invité');

      if (error) throw error;

      setToast({ message: '✅ Invitation acceptée !', type: 'success' });
      archiveNotification(notif.id, 'accepted');

      // Rediriger vers la liste
      const { data: wishlist } = await supabase
        .from('wishlists')
        .select('slug')
        .eq('id', wishlistId)
        .single();

      if (wishlist) {
        setTimeout(() => navigate(`/list/${wishlist.slug}`), 1500);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      setToast({ message: '❌ Erreur lors de l\'acceptation', type: 'error' });
    }
  };

  const handleRejectInvitation = async (notif: Notification) => {
    try {
      const { wishlistId } = notif.data;

      await supabase
        .from('wishlist_members')
        .update({
          status: 'refusé',
          approved: false,
        })
        .eq('wishlist_id', wishlistId)
        .eq('user_id', user!.id)
        .eq('status', 'invité');

      setToast({ message: '✅ Invitation refusée', type: 'success' });
      archiveNotification(notif.id, 'rejected');
    } catch (error) {
      console.error('❌ Erreur:', error);
      setToast({ message: '❌ Erreur lors du refus', type: 'error' });
    }
  };

  const handleAcceptAccessRequest = async (notif: Notification) => {
    try {
      const { wishlistId, requesterId, requesterEmail } = notif.data;

      console.log('🔵 Acceptation demande:', { wishlistId, requesterId });

      const { error, data } = await supabase
        .from('wishlist_members')
        .update({
          status: 'actif',
          approved: true,
          approved_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        })
        .eq('wishlist_id', wishlistId)
        .eq('user_id', requesterId)
        .eq('status', 'en_attente')
        .select();

      console.log('📊 Résultat update:', data);

      if (error) {
        console.error('❌ Erreur update:', error);
        throw error;
      }

      // Notifier le demandeur
      const { data: wishlist, error: wishlistError } = await supabase
        .from('wishlists')
        .select('slug, name')
        .eq('id', wishlistId)
        .single();

      if (wishlistError) {
        console.error('❌ Erreur récupération wishlist:', wishlistError);
        throw wishlistError;
      }

      await createNotification({
        userId: requesterId,
        type: 'acces_accorde',
        title: '✅ Demande acceptée',
        message: `Ta demande d'accès à "${wishlist.name}" a été acceptée ! Tu peux maintenant réserver des cadeaux sur cette liste.`,
        data: {
          wishlistId,
          wishlistSlug: wishlist.slug,
          accepted: true,
        },
      });

      setToast({
        message: `✅ ${requesterEmail} peut maintenant accéder à la liste`,
        type: 'success'
      });

      archiveNotification(notif.id, 'accepted');

      // Rediriger vers la liste
      if (wishlist) {
        setTimeout(() => navigate(`/list/${wishlist.slug}`), 1500);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      setToast({
        message: '❌ Erreur lors de l\'acceptation',
        type: 'error'
      });
    }
  };

  const handleRejectAccessRequest = async (notif: Notification) => {
    try {
      const { wishlistId, requesterId, requesterEmail } = notif.data;

      console.log('🔵 Refus demande:', { wishlistId, requesterId });

      const { error } = await supabase
        .from('wishlist_members')
        .update({
          status: 'refusé',
          approved: false,
        })
        .eq('wishlist_id', wishlistId)
        .eq('user_id', requesterId)
        .eq('status', 'en_attente');

      if (error) throw error;

      await createNotification({
        userId: requesterId,
        type: 'acces_refuse',
        title: '❌ Demande refusée',
        message: `Ta demande d'accès a été refusée.`,
        data: { wishlistId },
      });

      setToast({
        message: `✅ Demande de ${requesterEmail} refusée`,
        type: 'success'
      });

      archiveNotification(notif.id, 'rejected');
    } catch (error) {
      console.error('❌ Erreur:', error);
      setToast({
        message: '❌ Erreur lors du refus',
        type: 'error'
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invitation_liste':
        return '🎁';
      case 'demande_acces':
        return '🔔';
      case 'acces_accorde':
        return '✅';
      case 'acces_refuse':
        return '❌';
      case 'reservation_cadeau':
        return '🎯';
      case 'liberation_cadeau':
        return '🔓';
      default:
        return '📬';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.read && !n.action_taken);
      case 'all':
        return notifications.filter((n) => !n.action_taken);
      case 'archived':
        return notifications.filter((n) => n.action_taken);
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter((n) => !n.read && !n.action_taken).length;
  const archivedCount = notifications.filter((n) => n.action_taken).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <svg className="animate-spin h-12 w-12 text-purple-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          </div>

          {unreadCount > 0 && activeTab === 'unread' && (
            <button
              onClick={markAllAsRead}
              className={`px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all ${FOCUS_RING}`}
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* ONGLETS */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-4 py-3 font-semibold transition-all relative ${
              activeTab === 'unread'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            À traiter
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 font-semibold transition-all ${
              activeTab === 'all'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Toutes
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`px-4 py-3 font-semibold transition-all ${
              activeTab === 'archived'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Archivées
            {archivedCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full">
                {archivedCount}
              </span>
            )}
          </button>
        </div>

        {/* Liste notifications */}
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">
              {activeTab === 'unread' ? '🔕' : activeTab === 'all' ? '📭' : '📦'}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {activeTab === 'unread' && 'Aucune notification à traiter'}
              {activeTab === 'all' && 'Aucune notification'}
              {activeTab === 'archived' && 'Aucune notification archivée'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'unread' && 'Tu es à jour !'}
              {activeTab === 'all' && 'Les notifications apparaîtront ici.'}
              {activeTab === 'archived' && 'Les actions prises apparaîtront ici.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const needsAction =
                (notif.type === 'invitation_liste' ||
                 (notif.type === 'demande_acces' && !notif.data?.accepted)) &&
                !notif.action_taken;

              return (
                <div
                  key={notif.id}
                  className={`bg-white rounded-xl shadow-md p-4 transition-all hover:shadow-lg ${
                    !notif.read && !notif.action_taken
                      ? 'border-2 border-purple-200'
                      : notif.action_taken
                      ? 'border border-gray-200 opacity-75'
                      : 'border border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{notif.title}</h3>
                        {notif.action_taken && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            notif.action_taken === 'accepted'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {notif.action_taken === 'accepted' ? '✅ Accepté' : '❌ Refusé'}
                          </span>
                        )}
                      </div>

                      <p className="text-gray-700 text-sm mb-2">{notif.message}</p>

                      {/* ⬅️ BOUTON "VOIR LA LISTE" pour toutes les notifications avec wishlistSlug */}
                      {notif.data?.wishlistSlug && (
                        <button
                          onClick={() => navigate(`/list/${notif.data.wishlistSlug}`)}
                          className={`text-sm font-semibold text-purple-600 hover:text-purple-800 underline underline-offset-2 mt-1 ${FOCUS_RING}`}
                        >
                          📋 Voir la liste
                        </button>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(notif.created_at)}
                        {notif.action_taken_at && (
                          <span className="ml-2">
                            • Action prise le {new Date(notif.action_taken_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </p>

                      {/* Actions pour invitation */}
                      {notif.type === 'invitation_liste' && needsAction && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleAcceptInvitation(notif)}
                            className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all ${FOCUS_RING}`}
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => handleRejectInvitation(notif)}
                            className={`px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-all ${FOCUS_RING}`}
                          >
                            Refuser
                          </button>
                        </div>
                      )}

                      {/* Actions pour demande d'accès (owner) */}
                      {notif.type === 'demande_acces' && !notif.data?.accepted && needsAction && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleAcceptAccessRequest(notif)}
                            className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all ${FOCUS_RING}`}
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => handleRejectAccessRequest(notif)}
                            className={`px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-all ${FOCUS_RING}`}
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {!notif.read && !notif.action_taken && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                          title="Marquer comme lu"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
