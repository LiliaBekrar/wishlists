/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/components/RequestToReserveModal.tsx
// 🧠 Rôle : Modal "Pour réserver, rejoignez d'abord" pour listes PARTAGÉES

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Share2, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

interface RequestToReserveModalProps {
  wishlistId: string;
  wishlistTitle: string;
  itemTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RequestToReserveModal({
  wishlistId,
  wishlistTitle,
  itemTitle,
  onClose,
  onSuccess,
}: RequestToReserveModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ⚙️ Handler demande d'accès
  const handleRequest = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Vous devez être connecté');
      }

      // Vérifier si demande déjà existante
      const { data: existing } = await supabase
        .from('access_requests')
        .select('id, status')
        .eq('wishlist_id', wishlistId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'en_attente') {
          throw new Error('Vous avez déjà demandé à rejoindre cette liste');
        } else if (existing.status === 'refusée') {
          throw new Error('Votre demande a été refusée');
        }
      }

      // Créer demande
      const { error: insertError } = await supabase
        .from('access_requests')
        .insert({
          wishlist_id: wishlistId,
          user_id: user.id,
          message: message || null,
          status: 'en_attente',
        });

      if (insertError) throw insertError;

      // Envoyer notification owner
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sendNotification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'access_request',
            wishlistId,
          }),
        });
      }

      setSuccess(true);

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Error requesting access:', err);
      setError(err.message || 'Impossible de demander l\'accès');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Rejoindre la liste
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                <strong>{wishlistTitle}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Demande envoyée !</p>
                <p className="text-sm text-green-700 mt-1">
                  Le propriétaire va recevoir votre demande. Une fois approuvée, vous pourrez réserver ce cadeau.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Explication */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                Pour réserver "{itemTitle}"
              </p>
              <p className="text-sm text-blue-800">
                Cette liste est <strong>partagée</strong>. Pour réserver des cadeaux, vous devez d'abord être accepté par le propriétaire.
              </p>
            </div>

            {/* Message optionnel */}
            <div>
              <label
                htmlFor="reserve-message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Message au propriétaire (optionnel)
              </label>
              <textarea
                id="reserve-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pourquoi souhaitez-vous rejoindre cette liste ?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                disabled={loading}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleRequest}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envoi...</span>
                  </>
                ) : (
                  <span>Demander à rejoindre</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
