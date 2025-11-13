// 📄 src/pages/AcceptInvite.tsx
// 🧠 Rôle : Accepter invitation email (auto viewer pour listes privées)

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [wishlistTitle, setWishlistTitle] = useState('');

  useEffect(() => {
    const processInvite = async () => {
      try {
        const token = searchParams.get('token');
        if (!token) throw new Error('Token d\'invitation manquant');

        // Vérifier que user est connecté
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Rediriger vers login avec redirect vers cette page
          sessionStorage.setItem('invite_token', token);
          navigate(`/login?redirect=/accept-invite?token=${token}`);
          return;
        }

        // Décoder token (simplifié - en prod utiliser JWT verify)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const { wishlistId, email, exp } = payload;

        // Vérifier expiration (7 jours)
        if (Date.now() > exp) {
          throw new Error('Cette invitation a expiré');
        }

        // Vérifier que l'email correspond
        if (user.email !== email) {
          throw new Error('Cette invitation n\'est pas pour votre compte');
        }

        // Récup wishlist
        const { data: wishlist, error: wlError } = await supabase
          .from('wishlists')
          .select('id, title, visibility')
          .eq('id', wishlistId)
          .single();

        if (wlError) throw new Error('Liste introuvable');
        setWishlistTitle(wishlist.title);

        // Vérifier si déjà membre
        const { data: existingMember } = await supabase
          .from('wishlist_members')
          .select('id, status')
          .eq('wishlist_id', wishlistId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingMember) {
          if (existingMember.status === 'actif') {
            // Déjà membre actif
            navigate(`/lists/${wishlistId}`);
            return;
          } else {
            // Update status invite → actif
            const { error: updateError } = await supabase
              .from('wishlist_members')
              .update({
                status: 'actif',
                user_id: user.id
              })
              .eq('id', existingMember.id);

            if (updateError) throw updateError;
          }
        } else {
          // Créer nouveau membre (auto viewer)
          const { error: insertError } = await supabase
            .from('wishlist_members')
            .insert({
              wishlist_id: wishlistId,
              user_id: user.id,
              email: user.email,
              role: 'viewer',
              status: 'actif',
            });

          if (insertError) throw insertError;
        }

        setSuccess(true);

        // Redirection après 2s
        setTimeout(() => {
          navigate(`/lists/${wishlistId}`);
        }, 2000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error('Error accepting invite:', err);
        setError(err.message || 'Erreur lors de l\'acceptation de l\'invitation');
      } finally {
        setLoading(false);
      }
    };

    processInvite();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Traitement de votre invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Erreur</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Invitation acceptée !</h2>
          </div>
          <p className="text-gray-600 mb-2">
            Vous avez rejoint la liste <strong>{wishlistTitle}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Redirection en cours...
          </p>
        </div>
      </div>
    );
  }

  return null;
}
