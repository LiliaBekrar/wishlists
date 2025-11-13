/* eslint-disable @typescript-eslint/ban-ts-comment */
// 📄 supabase/functions/_shared/utils.ts
// 🧠 Utilitaires partagés entre Edge Functions
// 🛠️ Auteur : Claude IA pour WishLists v7

/**
 * Détecte l'URL de l'app frontend de manière intelligente
 *
 * Priorité :
 * 1. Origin/Referer header (auto-détection depuis requête)
 * 2. Variable APP_URL (override manuel)
 * 3. Détection via SUPABASE_URL (localhost → dev)
 * 4. Fallback production hardcodé
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck

export function getAppUrl(req: Request): string {
  // 1. Essayer depuis la requête
  const origin = req.headers.get('Origin') || req.headers.get('Referer');
  if (origin) {
    try {
      const url = new URL(origin);
      // Accepter localhost et domaines wishlists
      if (
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname.includes('wishlists')
      ) {
        return `${url.protocol}//${url.host}`;
      }
    } catch {
      // Parsing échoué, continuer
    }
  }

  // 2. Variable d'env explicite
  const envUrl = Deno.env.get('APP_URL');
  if (envUrl) return envUrl;

  // 3. Détecter environnement local via Supabase URL
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  if (
    supabaseUrl.includes('127.0.0.1') ||
    supabaseUrl.includes('localhost')
  ) {
    return 'http://localhost:5173';
  }

  // 4. Fallback production (⬅️ MODIFIER avec ton domaine)
  return 'https://wishlists.app';
}

/**
 * Génère un token JWT simple pour invitations
 */
export function generateInviteToken(payload: any): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const secret = Deno.env.get('JWT_SECRET') || 'your-secret-key-change-me';

  const signature = btoa(`${header}.${body}.${secret}`);

  return `${header}.${body}.${signature}`;
}

/**
 * Vérifie les variables d'environnement critiques
 */
export function checkEnvVars(): { ok: boolean; missing: string[] } {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
  ];

  const missing = required.filter(key => !Deno.env.get(key));

  return {
    ok: missing.length === 0,
    missing,
  };
}
