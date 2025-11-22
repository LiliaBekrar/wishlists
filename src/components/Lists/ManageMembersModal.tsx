// 📄 src/components/Lists/ManageMembersModal.tsx

import { useState } from 'react';
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
  members?: Member[]; // ✅ optionnel
  onMembersChange?: (members: Member[]) => void;
  onToast?: (toast: { type: 'success' | 'error'; message: string }) => void;
  isOwner?: boolean; // ✅ existe pour les appels, mais on ne le destructure plus
}

export default function ManageMembersModal({
  isOpen,
  onClose,
  wishlistId,
  members: initialMembers = [], // ✅ default []
  onMembersChange,
  onToast,
}: ManageMembersModalProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);

  if (!isOpen) return null;

  const syncMembers = (next: Member[]) => {
    setMembers(next);
    onMembersChange?.(next);
  };

  // 🆕 APPROUVER : approved = true + status = 'actif'
  const handleApproveMember = async (memberId: string) => {
    if (!wishlistId) return;

    setLoadingMemberId(memberId);

    try {
      const { error } = await supabase
        .from('wishlist_members')
        .update({
          approved: true, // ✅ pour la policy RLS
          status: 'actif', // ✅ cohérent avec le reste de l’app
        })
        .eq('id', memberId);

      if (error) {
        console.error('❌ [ManageMembersModal] Erreur approveMember:', error);
        onToast?.({
          type: 'error',
          message: "Impossible d'approuver ce membre.",
        });
        return;
      }

      const next: Member[] = members.map((m): Member =>
        m.id === memberId
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
      console.error('❌ [ManageMembersModal] Exception approveMember:', err);
      onToast?.({
        type: 'error',
        message: "Erreur lors de l'approbation.",
      });
    } finally {
      setLoadingMemberId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            👥 Gestion des membres
          </h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 ${FOCUS_RING}`}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {members.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun membre pour le moment.
            </p>
          ) : (
            <ul className="space-y-3">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.display_name || member.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      @{member.username}
                      {member.email ? ` · ${member.email}` : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Rôle : {member.role === 'owner' ? 'Propriétaire' : 'Invité'}
                      {' · '}
                      Statut :{' '}
                      {member.status === 'actif'
                        ? '✅ Actif'
                        : '⏳ En attente'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.status === 'en_attente' && (
                      <button
                        type="button"
                        disabled={loadingMemberId === member.id}
                        onClick={() => handleApproveMember(member.id)}
                        className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 ${FOCUS_RING}`}
                      >
                        {loadingMemberId === member.id ? '...' : '✅ Approuver'}
                      </button>
                    )}
                    {/* Bouton supprimer éventuel ici */}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 ${FOCUS_RING}`}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
