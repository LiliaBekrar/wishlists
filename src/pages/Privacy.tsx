// 📄 PrivacyPolicy.tsx (version avec card overlap + date GitHub)

import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ModernBanner from '../components/banners';
import { APP_NAME, FOCUS_RING, BANNER_HEIGHT } from '../utils/constants';

// ⚙️ Paramètres à personnaliser
const CONTACT_EMAIL = 'liliabekrar.github+dpo-wishlists@gmail.com'; // ⬅️ Ton e-mail de contact
const GITHUB_REPO = 'liliabekrar/wishlists'; // ⬅️ Format: "username/repo"
const FALLBACK_DATE = '14 novembre 2025'; // ⬅️ Date par défaut si GitHub échoue

export default function PrivacyPolicy() {
  const [lastUpdate, setLastUpdate] = useState<string>(FALLBACK_DATE);
  const [loading, setLoading] = useState(true);

  // Récupérer la date du dernier commit sur privacy
  useEffect(() => {
    const fetchLastCommitDate = async () => {
      try {
        // API GitHub pour récupérer les commits du fichier
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/commits?path=src/pages/Privacy.tsx&per_page=1`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            const commitDate = new Date(data[0].commit.author.date);
            // Format français
            const formatted = commitDate.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            setLastUpdate(formatted);
          }
        }
      } catch (error) {
        console.error('Erreur récupération date GitHub:', error);
        // On garde la date fallback
      } finally {
        setLoading(false);
      }
    };

    fetchLastCommitDate();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Bannière (même hauteur que Home) */}
      <div className="relative overflow-hidden">
        <ModernBanner height={BANNER_HEIGHT.medium} className="sm:h-[300px] md:h-[350px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 drop-shadow-lg" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold drop-shadow-lg">
              Politique de Confidentialité
            </h1>
          </div>
        </div>
      </div>

      {/* Contenu qui mange la bannière (même technique que Home) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 md:-mt-24 relative z-10 pb-12">
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-white/20 p-6 sm:p-8 md:p-10">

          {/* Retour */}
          <Link
            to="/"
            className={`inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors ${FOCUS_RING} rounded-lg px-2 py-1`}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          {/* Date MAJ depuis GitHub */}
          <p className="text-sm text-gray-500 mb-8">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Chargement...
              </span>
            ) : (
              <>
                Dernière mise à jour : {lastUpdate}
                {lastUpdate !== FALLBACK_DATE && (
                  <a
                    href={`https://github.com/${GITHUB_REPO}/commits/main/src/pages/PrivacyPolicy.tsx`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline text-xs"
                    title="Voir l'historique sur GitHub"
                  >
                    (historique)
                  </a>
                )}
              </>
            )}
          </p>

          {/* Intro */}
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-700 leading-relaxed text-base mb-8">
              {APP_NAME} est un projet perso pour t'aider à organiser tes listes de cadeaux.
              Je collecte le strict minimum de données pour que l'app fonctionne, et je ne
              vends <strong>jamais</strong> tes infos à qui que ce soit.
            </p>

            {/* ... (reste du contenu identique) ... */}

            {/* 1. Données collectées */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🔍 Données collectées
              </h2>
              <div className="bg-blue-50 rounded-xl p-5 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">📧 Compte</h3>
                  <p className="text-gray-700 text-sm">
                    Ton e-mail (pour la connexion magic link) + pseudonyme et photo de profil optionnels.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">🎁 Utilisation</h3>
                  <p className="text-gray-700 text-sm">
                    Tes listes, cadeaux, réservations. <strong>Les réservants restent anonymes</strong> pour
                    les propriétaires de listes.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">🔧 Technique</h3>
                  <p className="text-gray-700 text-sm">
                    Cookies de session (authentification Supabase), préférences de thème (localStorage).
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Utilisation */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🛠️ Comment j'utilise tes données
              </h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Faire fonctionner l'app (créer/partager tes listes)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>T'envoyer des liens de connexion par e-mail (magic link)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Corriger les bugs et améliorer l'expérience</span>
                </li>
              </ul>
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-sm text-yellow-800 font-semibold">
                  ⚠️ Je ne vends <strong>jamais</strong> tes données. Jamais.
                </p>
              </div>
            </section>

            {/* 3. Partage */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🌐 Qui voit mes données ?
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Toi seul·e</strong> contrôles qui voit tes listes (privées, partagées ou publiques).
                </p>
                <p>
                  <strong>Supabase</strong> héberge la base de données (serveurs en Europe, certifiés sécurité).
                </p>
                <p>
                  <strong>Gmail SMTP</strong> : j'utilise mon compte Gmail personnel pour envoyer les magic links de connexion (aucun e-mail n'est partagé avec Google au-delà de l'envoi technique).
                </p>
                <p>
                  <strong>Pas de trackers tiers</strong> : pas de Google Analytics, pas de pub, rien.
                </p>
              </div>
            </section>

            {/* 4. Tes droits (simplifié) */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🔐 Tes droits (RGPD)
              </h2>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Selon le RGPD, tu as le droit de :
                </p>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span><strong>Accéder</strong> à toutes tes données</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span><strong>Corriger</strong> tes infos (pseudo, email)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span><strong>Supprimer</strong> ton compte et toutes tes données</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span><strong>Exporter</strong> tes données (portabilité)</span>
                  </li>
                </ul>
                <div className="mt-5 pt-5 border-t border-blue-200">
                  <p className="text-sm text-gray-700">
                    <strong>Pour exercer ces droits</strong>, contacte-moi par e-mail.
                    Ces fonctions seront bientôt disponibles directement dans ton profil.
                  </p>
                </div>
              </div>
            </section>

            {/* 5. Sécurité */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🔒 Sécurité
              </h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>HTTPS partout (connexion chiffrée)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Pas de mot de passe stocké (magic link Supabase)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Anonymisation des réservants (le propriétaire ne voit jamais qui a réservé)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Contrôle d'accès strict (RLS Supabase)</span>
                </li>
              </ul>
            </section>

            {/* 6. E-mails */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📧 E-mails envoyés
              </h2>
              <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm">
                <p className="text-gray-700">
                  <strong>Connexion uniquement</strong> : tu reçois un e-mail avec un lien magique quand tu te connectes.
                </p>
                <p className="text-gray-700">
                  <strong>Pas d'e-mails marketing</strong> : je n'envoie pas de newsletter, promo, ou spam.
                </p>
                <p className="text-gray-700 text-xs mt-3">
                  ⚠️ Les e-mails peuvent arriver dans tes spams car je n'ai pas encore de serveur SMTP professionnel.
                </p>
              </div>
            </section>

            {/* 7. Conservation */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ⏳ Combien de temps je garde tes données ?
              </h2>
              <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm">
                <p className="text-gray-700">
                  <strong>Compte actif :</strong> tant que tu l'utilises
                </p>
                <p className="text-gray-700">
                  <strong>Compte inactif :</strong> 3 ans sans connexion → suppression automatique
                </p>
                <p className="text-gray-700">
                  <strong>Logs techniques :</strong> 30 jours max
                </p>
              </div>
            </section>

            {/* 8. Contact */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                💬 Des questions ?
              </h2>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      Contacte-moi
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Pour toute question sur tes données personnelles, envoie-moi un e-mail :
                    </p>
                    <a
                      href={`mailto:${CONTACT_EMAIL}?subject=Question%20Privacy%20-%20WishLists`}
                      className={`inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors ${FOCUS_RING}`}
                    >
                      <Mail className="w-4 h-4" />
                      {CONTACT_EMAIL}
                    </a>
                    <p className="text-xs text-gray-600 mt-3">
                      Je réponds généralement sous 48h (c'est un projet perso, sois patient·e 😊)
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer simple */}
            <div className="pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>
                Cette page est volontairement simple. Si tu veux les détails techniques RGPD,
                c'est sur le{' '}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  site de la CNIL
                </a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
