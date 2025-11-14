/* eslint-disable @typescript-eslint/no-unused-vars */
// 📄 ManageMembersModal.tsx
// 🧠 Rôle : Modal pour gérer les membres (inviter, retirer, changer rôle)

import { useState } from 'react';
import { useMembers } from '../../hooks/useMembers';
import { FOCUS_RING } from '../../utils/constants';
import Toast from '../Toast';

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistId: string;
  isOwner: boolean; // ⬅️ Seul l'owner peut inviter/retirer
}

export default function ManageMembersModal({
  isOpen,
  onClose,
  wishlistId,
  isOwner,
}: ManageMembersModalProps) {
  const { members, loading, removeMember, acceptMember } = useMembers(wishlistId);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;


  // ❌ Retirer un membre
  const handleRemove = async (memberId: string, username: string) => {
    if (!confirm(`Retirer ${username} de cette liste ?`)) return;

    try {
      await removeMember(memberId);
      setToast({ message: `✅ ${username} retiré`, type: 'success' });
    } catch (error) {
      setToast({ message: '❌ Erreur lors du retrait', type: 'error' });
    }
  };

  // ✅ Accepter une demande
  const handleAccept = async (memberId: string, username: string) => {
    try {
      await acceptMember(memberId);
      setToast({ message: `✅ ${username} accepté`, type: 'success' });
    } catch (error) {
      setToast({ message: '❌ Erreur', type: 'error' });
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">👥 Gérer les membres</h2>
            <button
              onClick={onClose}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-all ${FOCUS_RING}`}
              aria-label="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Liste des membres */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Membres actuels ({members.length})
              </h3>

              {loading ? (
                <p className="text-gray-500 text-center py-8">Chargement...</p>
              ) : members.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun membre pour le moment</p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const displayName =
                      member.profiles?.display_name ||
                      member.profiles?.username ||
                      'Utilisateur';
                    const isPending = member.status === 'pending';

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                            {displayName[0].toUpperCase()}
                          </div>

                          {/* Infos */}
                          <div>
                            <p className="font-semibold text-gray-900">{displayName}</p>
                            <p className="text-sm text-gray-500">
                              {member.role === 'owner' && '👑 Propriétaire'}
                              {member.role === 'viewer' && '👀 Viewer'}
                              {isPending && ' (en attente)'}
                            </p>
                          </div>
                        </div>

                        {/* Actions (owner only) */}
                        {isOwner && member.role !== 'owner' && (
                          <div className="flex gap-2">
                            {isPending && (
                              <button
                                onClick={() => handleAccept(member.id, displayName)}
                                className={`px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium ${FOCUS_RING}`}
                              >
                                ✅ Accepter
                              </button>
                            )}
                            <button
                              onClick={() => handleRemove(member.id, displayName)}
                              className={`px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium ${FOCUS_RING}`}
                            >
                              ❌ Retirer
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg ${FOCUS_RING}`}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
