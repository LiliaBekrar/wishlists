/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/components/Lists/ManageMembersModal.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FOCUS_RING } from '../../utils/constants';

interface Member {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string;
  email: string | null;
  role: 'owner' | 'viewer';
  status: 'actif' | 'en_attente';
  approved?: boolean | null;
}

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistId: string;
  members?: Member[];
  onMembersChange?: (members: Member[]) => void;
  onToast?: (toast: { type: 'success' | 'error'; message: string }) => void;
  isOwner?: boolean;
}

export default function ManageMembersModal({
  isOpen,
  onClose,
  wishlistId,
  members: externalMembers,
  onMembersChange,
  onToast,
}: ManageMembersModalProps) {
  const [members, setMembers] = useState<Member[]>(externalMembers || []);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);

  // ✅ Charger les membres si pas fournis en props
  useEffect(() => {
    if (!isOpen) return;

    if (externalMembers && externalMembers.length > 0) {
      // Utiliser les membres fournis en props
      setMembers(externalMembers);
    } else {
      // Charger depuis la base
      fetchMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, wishlistId]);

  const fetchMembers = async () => {
    if (!wishlistId) return;

    setLoadingMembers(true);

    try {
      const { data, error } = await supabase
        .from('wishlist_members')
        .select(`
          user_id,
          wishlist_id,
          role,
          status,
          approved,
          joined_at,
          requested_at,
          approved_at,
          profiles!inner(
            username,
            display_name,
            email
          )
        `)
        .eq('wishlist_id', wishlistId);

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      console.log('📊 Données brutes reçues:', data);

      const formattedMembers: Member[] = (data || [])
        .map((m: any) => ({
          id: m.user_id, // ⬅️ Utiliser user_id comme id
          user_id: m.user_id,
          display_name: m.profiles?.display_name || null,
          username: m.profiles?.username || 'Inconnu',
          email: m.profiles?.email || null,
          role: m.role,
          status: m.status,
          approved: m.approved,
        }))
        .sort((a, b) => {
          // En attente en premier
          if (a.status === 'en_attente' && b.status !== 'en_attente') return -1;
          if (a.status !== 'en_attente' && b.status === 'en_attente') return 1;
          return 0;
        });

      console.log('✅ Membres formatés et triés:', formattedMembers);
      setMembers(formattedMembers);
      onMembersChange?.(formattedMembers);
    } catch (err) {
      console.error('❌ Erreur chargement membres:', err);
      onToast?.({
        type: 'error',
        message: 'Erreur lors du chargement des membres',
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  if (!isOpen) return null;

  const syncMembers = (next: Member[]) => {
    setMembers(next);
    onMembersChange?.(next);
  };

  const handleApproveMember = async (userId: string) => {
    if (!wishlistId) return;

    setLoadingMemberId(userId);

    try {
      const { error } = await supabase
        .from('wishlist_members')
        .update({
          approved: true,
          status: 'actif',
          approved_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('wishlist_id', wishlistId);

      if (error) {
        console.error('❌ Erreur approveMember:', error);
        onToast?.({
          type: 'error',
          message: "Impossible d'approuver ce membre.",
        });
        return;
      }

      const next: Member[] = members.map((m): Member =>
        m.user_id === userId
          ? {
              ...m,
              approved: true,
              status: 'actif',
            }
          : m
      );
      syncMembers(next);

      onToast?.({
        type: 'success',
        message: '✅ Membre approuvé !',
      });
    } catch (err) {
      console.error('❌ Exception approveMember:', err);
      onToast?.({
        type: 'error',
        message: "Erreur lors de l'approbation.",
      });
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!wishlistId) return;
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) return;

    setLoadingMemberId(userId);

    try {
      const { error } = await supabase
        .from('wishlist_members')
        .delete()
        .eq('user_id', userId)
        .eq('wishlist_id', wishlistId);

      if (error) {
        console.error('❌ Erreur removeMember:', error);
        onToast?.({
          type: 'error',
          message: 'Impossible de retirer ce membre.',
        });
        return;
      }

      const next = members.filter((m) => m.user_id !== userId);
      syncMembers(next);

      onToast?.({
        type: 'success',
        message: '✅ Membre retiré !',
      });
    } catch (err) {
      console.error('❌ Exception removeMember:', err);
      onToast?.({
        type: 'error',
        message: 'Erreur lors de la suppression.',
      });
    } finally {
      setLoadingMemberId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        // Fermer si clic sur le backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <h2 className="text-xl font-bold text-gray-900">
            👥 Gestion des membres
          </h2>
          <button
            onClick={onClose}
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-all shadow-sm ${FOCUS_RING}`}
            aria-label="Fermer"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Chargement des membres...</p>
              </div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-600 text-lg font-medium mb-2">
                Aucun membre pour le moment
              </p>
              <p className="text-gray-500 text-sm">
                Partagez votre liste pour inviter des membres !
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {members.map((member) => (
                <li
                  key={member.user_id}
                  className={`
                    flex items-center justify-between gap-4 p-4 rounded-xl border-2 transition-all
                    ${member.status === 'en_attente'
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-purple-200'
                    }
                  `}
                >
                  {/* Info membre */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900 text-base truncate">
                        {member.display_name || member.username}
                      </p>
                      {member.role === 'owner' && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                          👑 Propriétaire
                        </span>
                      )}
                      {member.status === 'en_attente' && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                          ⏳ En attente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      @{member.username}
                      {member.email && ` · ${member.email}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {member.status === 'en_attente' && (
                      <>
                        <button
                          type="button"
                          disabled={loadingMemberId === member.user_id}
                          onClick={() => handleApproveMember(member.user_id)}
                          className={`
                            px-4 py-2 text-sm rounded-lg font-semibold text-white
                            bg-green-600 hover:bg-green-700
                            disabled:bg-gray-400 disabled:cursor-not-allowed
                            transition-all hover:scale-105
                            ${FOCUS_RING}
                          `}
                        >
                          {loadingMemberId === member.user_id ? (
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                          ) : (
                            '✅ Approuver'
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={loadingMemberId === member.user_id}
                          onClick={() => handleRemoveMember(member.user_id)}
                          className={`
                            px-4 py-2 text-sm rounded-lg font-semibold text-white
                            bg-red-600 hover:bg-red-700
                            disabled:bg-gray-400 disabled:cursor-not-allowed
                            transition-all hover:scale-105
                            ${FOCUS_RING}
                          `}
                        >
                          ❌ Refuser
                        </button>
                      </>
                    )}

                    {member.status === 'actif' && member.role !== 'owner' && (
                      <button
                        type="button"
                        disabled={loadingMemberId === member.user_id}
                        onClick={() => handleRemoveMember(member.user_id)}
                        className={`
                          p-2 rounded-lg
                          bg-red-100 hover:bg-red-200
                          text-red-600 hover:text-red-700
                          disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
                          transition-all
                          ${FOCUS_RING}
                        `}
                        title="Retirer ce membre"
                      >
                        {loadingMemberId === member.user_id ? (
                          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all ${FOCUS_RING}`}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
