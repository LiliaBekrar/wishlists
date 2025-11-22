/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/components/budget/ExternalGiftModal.tsx
// 🧠 Rôle : Modal pour ajouter un cadeau acheté hors-app (style AddItemModal)


import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FOCUS_RING } from '../../utils/constants';

interface ExternalGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

// Type pour les destinataires (mixte external + profiles)
interface RecipientOption {
  id: string;
  name: string;
  type: 'external' | 'profile';
  profileId?: string;
}


export function ExternalGiftModal({ isOpen, onClose, userId, onSuccess }: ExternalGiftModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États du formulaire
  const [recipientType, setRecipientType] = useState<'existing' | 'new'>('existing');
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientOption | null>(null);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [description, setDescription] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [theme, setTheme] = useState<'noël' | 'anniversaire' | 'naissance' | 'mariage' | 'autre'>('autre');
  const [notes, setNotes] = useState('');

  // Liste des destinataires
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);

  // Charger les destinataires au montage
  React.useEffect(() => {
    if (isOpen && userId) {
      fetchRecipients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

async function fetchRecipients() {
  try {
    // 1️⃣ External recipients
    const { data: externalRecipients } = await supabase
      .from('external_recipients')
      .select('id, name, profile_id')
      .eq('user_id', userId)
      .order('name');

    // 2️⃣ Owners des listes où l'utilisateur est membre
    const { data: wishlistMembers } = await supabase
      .from('wishlist_members')
      .select(`
        wishlists!inner(
          owner_id,
          profiles!wishlists_owner_id_fkey!inner(
            id,
            display_name
          )
        )
      `)
      .eq('user_id', userId)
      .neq('wishlists.owner_id', userId);

    console.log('🧪 wishlistMembers brute:', wishlistMembers);

    const options: RecipientOption[] = [];

    // External recipients purs (sans lien à un profil)
    externalRecipients?.forEach((er: any) => {
      if (!er.profile_id) {
        options.push({
          id: er.id,
          name: er.name,
          type: 'external',
        });
      }
    });

    const seenProfileIds = new Set<string>();

    (wishlistMembers ?? []).forEach((wm: any) => {
      // `wm.wishlists` peut être un tableau ou un objet selon la forme renvoyée
      const wishlistsArray = Array.isArray(wm.wishlists)
        ? wm.wishlists
        : wm.wishlists
        ? [wm.wishlists]
        : [];

      wishlistsArray.forEach((w: any) => {
        // `profiles` aussi peut être un tableau ou un objet
        const profile =
          Array.isArray(w.profiles) ? w.profiles[0] : w.profiles;

        if (!profile) return;

        const profileId = profile.id;
        if (!profileId || seenProfileIds.has(profileId)) return;
        seenProfileIds.add(profileId);

        const existingExternal = externalRecipients?.find(
          (er: any) => er.profile_id === profileId
        );

        options.push({
          id: existingExternal?.id || `profile-${profileId}`,
          name: profile.display_name || 'Utilisateur',
          type: existingExternal ? 'external' : 'profile',
          profileId,
        });
      });
    });

    options.sort((a, b) => a.name.localeCompare(b.name));
    setRecipients(options);
  } catch (err) {
    console.error('Erreur chargement destinataires:', err);
  }
}


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let recipientId: string | null = null;

      // 1️⃣ Gérer le destinataire
      if (recipientType === 'new' && newRecipientName.trim()) {
        const { data: newRecipient, error: recipientError } = await supabase
          .from('external_recipients')
          .insert({
            user_id: userId,
            name: newRecipientName.trim(),
          })
          .select()
          .single();

        if (recipientError) throw recipientError;
        recipientId = newRecipient.id;
      } else if (recipientType === 'existing' && selectedRecipient) {
        if (selectedRecipient.type === 'external') {
          recipientId = selectedRecipient.id;
        } else if (selectedRecipient.type === 'profile') {
          const { data: existing } = await supabase
            .from('external_recipients')
            .select('id')
            .eq('user_id', userId)
            .eq('profile_id', selectedRecipient.profileId!)
            .maybeSingle();

          if (existing) {
            recipientId = existing.id;
          } else {
            const { data: newRecipient, error: recipientError } = await supabase
              .from('external_recipients')
              .insert({
                user_id: userId,
                name: selectedRecipient.name,
                profile_id: selectedRecipient.profileId,
              })
              .select()
              .single();

            if (recipientError) throw recipientError;
            recipientId = newRecipient.id;
          }
        }
      }

      if (!recipientId) {
        throw new Error('Veuillez sélectionner ou créer un destinataire');
      }

      // 2️⃣ Créer le cadeau
      const { error: giftError } = await supabase.from('external_gifts').insert({
        user_id: userId,
        recipient_id: recipientId,
        description: description.trim() || null,
        paid_amount: parseFloat(paidAmount),
        purchase_date: purchaseDate,
        theme,
        notes: notes.trim() || null,
      });

      if (giftError) throw giftError;

      // 3️⃣ Succès
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Erreur ajout cadeau hors-app:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setRecipientType('existing');
    setSelectedRecipient(null);
    setNewRecipientName('');
    setDescription('');
    setPaidAmount('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setTheme('autre');
    setNotes('');
    setError(null);
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl sm:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-xl sm:rounded-t-2xl z-10">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 id="modal-title" className="text-2xl font-bold">
            🛍️ Ajouter un cadeau hors-app
          </h2>
          <p className="text-sm opacity-90 mt-1">
            Ajoute un cadeau acheté en dehors de WishLists
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm font-medium">
              ❌ {error}
            </div>
          )}

          {/* Destinataire */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              👤 Destinataire *
            </label>

            {/* Tabs Existant / Nouveau */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setRecipientType('existing')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  recipientType === 'existing'
                    ? 'bg-green-100 text-green-700 border-2 border-green-600'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                }`}
                disabled={loading}
              >
                📋 Existant
              </button>
              <button
                type="button"
                onClick={() => setRecipientType('new')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  recipientType === 'new'
                    ? 'bg-green-100 text-green-700 border-2 border-green-600'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                }`}
                disabled={loading}
              >
                ➕ Nouveau
              </button>
            </div>

            {recipientType === 'existing' ? (
              <div className="relative">
                <select
                  value={selectedRecipient?.id || ''}
                  onChange={(e) => {
                    const recipient = recipients.find((r) => r.id === e.target.value);
                    setSelectedRecipient(recipient || null);
                  }}
                  required
                  disabled={loading}
                  className={`
                    w-full
                    pe-10 ps-4 py-3
                    text-sm sm:text-base
                    border-2 rounded-xl
                    bg-white
                    shadow-sm
                    appearance-none
                    ${FOCUS_RING}
                    border-gray-200 hover:border-green-300
                    disabled:bg-gray-100 disabled:text-gray-400
                    transition-all
                  `}
                >
                  <option value="">-- Sélectionnez un destinataire --</option>
                  {recipients.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.type === 'profile' ? '👤' : ''}
                    </option>
                  ))}
                </select>

                {/* Chevron custom à droite */}
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.118l3.71-3.887a.75.75 0 111.08 1.04l-4.24 4.445a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>
            ) : (

              <input
                type="text"
                value={newRecipientName}
                onChange={(e) => setNewRecipientName(e.target.value)}
                placeholder="Nom du destinataire (ex: Mamie Jeanne)"
                required
                maxLength={100}
                className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-green-300`}
                disabled={loading}
              />
            )}

            {recipients.length === 0 && recipientType === 'existing' && (
              <p className="text-sm text-amber-600 mt-2 bg-amber-50 px-3 py-2 rounded-lg">
                ⚠️ Aucun destinataire trouvé. Créez-en un nouveau ou rejoignez des listes.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="gift-description" className="block text-sm font-semibold text-gray-700 mb-2">
              📝 Description du cadeau (optionnel)
            </label>
            <input
              id="gift-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Livre 'Le Petit Prince', Pull rouge..."
              maxLength={200}
              className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-green-300`}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">{description.length}/200 caractères</p>
          </div>

          {/* Montant + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Montant */}
            <div>
              <label htmlFor="gift-amount" className="block text-sm font-semibold text-gray-700 mb-2">
                💰 Montant payé * <span className="text-red-600">(obligatoire)</span>
              </label>
              <div className="relative">
                <input
                  id="gift-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="49.99"
                  required
                  className={`w-full px-4 py-3 pr-8 text-base border-2 ${
                    !paidAmount ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl transition-all ${FOCUS_RING} hover:border-green-300`}
                  disabled={loading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
              </div>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="gift-date" className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Date d'achat *
              </label>
              <input
                id="gift-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-green-300`}
                disabled={loading}
              />
            </div>
          </div>

          {/* Thème */}
          <div>
            <label htmlFor="gift-theme" className="block text-sm font-semibold text-gray-700 mb-2">
              🎨 Thème *
            </label>
            <select
              id="gift-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as typeof theme)}
              required
              className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-green-300`}
              disabled={loading}
            >
              <option value="noël">🎄 Noël</option>
              <option value="anniversaire">🎂 Anniversaire</option>
              <option value="naissance">👶 Naissance</option>
              <option value="mariage">💍 Mariage</option>
              <option value="autre">🎁 Autre</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="gift-notes" className="block text-sm font-semibold text-gray-700 mb-2">
              💬 Notes (optionnel)
            </label>
            <textarea
              id="gift-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Où acheté, remarques particulières..."
              rows={3}
              maxLength={500}
              className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all resize-none ${FOCUS_RING} hover:border-green-300`}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">{notes.length}/500 caractères</p>
          </div>

          {/* Boutons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all disabled:opacity-50 ${FOCUS_RING}`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !paidAmount || parseFloat(paidAmount) <= 0}
              className={`flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all ${FOCUS_RING}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Ajout en cours...
                </span>
              ) : (
                '✨ Ajouter le cadeau'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
