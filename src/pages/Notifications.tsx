/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/pages/Notifications.tsx
// 🧠 Rôle : Page listant toutes les notifications avec actions

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { FOCUS_RING } from '../utils/constants';
import Toast from '../components/Toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

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

  const handleAcceptInvitation = async (notif: Notification) => {
    try {
      const { wishlistId } = notif.data;

      // Mettre à jour le membre
      const { error } = await supabase
        .from('wishlist_members')
        .update({ status: 'actif' })
        .eq('wishlist_id', wishlistId)
        .eq('user_id', user!.id)
        .eq('status', 'invité');

      if (error) throw error;

      setToast({ message: '✅ Invitation acceptée !', type: 'success' });
      deleteNotification(notif.id);

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

      // Supprimer le membre
      await supabase
        .from('wishlist_members')
        .delete()
        .eq('wishlist_id', wishlistId)
        .eq('user_id', user!.id)
        .eq('status', 'invité');

      setToast({ message: '✅ Invitation refusée', type: 'success' });
      deleteNotification(notif.id);
    } catch (error) {
      console.error('❌ Erreur:', error);
      setToast({ message: '❌ Erreur lors du refus', type: 'error' });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invitation_liste':
        return '🎁';
      case 'demande_acces':
        return '🔔';
      case 'reservation_cadeau':
        return '🎯';
      case 'liberation_cadeau':
        return '🔓';
      case 'achat_cadeau':
        return '✅';
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

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">
              {unreadNotifications.length} non lue{unreadNotifications.length > 1 ? 's' : ''}
            </p>
          </div>

          {unreadNotifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className={`px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all ${FOCUS_RING}`}
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Liste notifications */}
        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">🔕</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune notification</h3>
            <p className="text-gray-600">Tu es à jour !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Non lues */}
            {unreadNotifications.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 px-2">
                  Non lues
                </h2>
                {unreadNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="bg-white rounded-xl shadow-md border-2 border-purple-200 p-4 mb-3 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl flex-shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{notif.title}</h3>
                        <p className="text-gray-700 text-sm mb-2">{notif.message}</p>
                        <p className="text-xs text-gray-500">{formatDate(notif.created_at)}</p>

                        {/* Actions pour invitation */}
                        {notif.type === 'invitation_liste' && (
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
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                          title="Marquer comme lu"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
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
                ))}
              </div>
            )}

            {/* Lues */}
            {readNotifications.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 px-2 mt-8">
                  Lues
                </h2>
                {readNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="bg-white/50 rounded-xl border border-gray-200 p-4 mb-3 opacity-60"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-700 mb-1">{notif.title}</h3>
                        <p className="text-gray-600 text-sm mb-1">{notif.message}</p>
                        <p className="text-xs text-gray-500">{formatDate(notif.created_at)}</p>
                      </div>
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
