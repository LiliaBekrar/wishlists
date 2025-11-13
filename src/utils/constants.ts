// 📄 constants.ts
// 🧠 Rôle : Constantes configurables
export const APP_NAME = 'WishLists by Lilia'; // ⬅️ Nom de l'app
export const APP_TAGLINE = 'Crée, partage, maîtrise ton budget cadeaux.'; // ⬅️ Slogan

// ============================================================
// 🎨 THÈMES - Types de listes de cadeaux
// ⚙️ Paramètres à personnaliser
// ============================================================
export const THEMES = {
  'noël': {
    label: 'Noël 🎄',
    colors: ['#2d5016', '#c41e3a', '#ffd700'],
    banner: 'christmas'
  },
  'anniversaire': {
    label: 'Anniversaire 🎂',
    colors: ['#8b5cf6', '#ec4899', '#fbbf24'],
    banner: 'birthday'
  },
  'naissance': {
    label: 'Naissance 👶',
    colors: ['#60a5fa', '#f9a8d4', '#fde68a'],
    banner: 'baby'
  },
  'mariage': {
    label: 'Mariage 💍',
    colors: ['#e11d48', '#fef3c7', '#fda4af'],
    banner: 'wedding'
  },
  'autre': {
    label: 'Autre 🎁',
    colors: ['#6b7280', '#9ca3af', '#d1d5db'],
    banner: 'other'
  }
} as const;

export type ThemeType = keyof typeof THEMES;

// ============================================================
// 🎨 BANNIÈRES : DIMENSIONS & STYLES
// ============================================================
export const BANNER_HEIGHT = {
  small: 200,      // ⬅️ Petite bannière (cards)
  medium: 300,     // ⬅️ Moyenne (pages listes)
  large: 350,      // ⬅️ Grande (home, profils publics)
  xlarge: 400      // ⬅️ Très grande (landing pages spéciales)
} as const;

export const BANNER_DEFAULT_HEIGHT = BANNER_HEIGHT.medium; // ⬅️ Hauteur par défaut

// Opacités pour les effets de bannières
export const BANNER_OPACITY = {
  pattern: 0.1,      // ⬅️ Motifs de fond (flocons, confettis)
  overlay: 0.6,      // ⬅️ Formes avec blur
  decorations: 0.8,  // ⬅️ Éléments décoratifs (étoiles, pétales)
  text: 0.95         // ⬅️ Texte sur bannière
} as const;

export const BANNER_PATTERN_OPACITY = BANNER_OPACITY.pattern; // ⬅️ Rétrocompatibilité

export const FOCUS_RING = 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';

// ============================================================
// 🔐 VISIBILITÉS - Règles d'accès aux listes
// ⚙️ Paramètres à personnaliser
// ============================================================
export const VISIBILITIES = {
  privée: {
    label: '🔒 Privée',
    description: 'Invitation e-mail → auto viewer ; Lien → demande validation'
  },
  partagée: {
    label: '🔗 Partagée',
    description: 'Lecture libre ; Réserver → demande à rejoindre'
  },
  publique: {
    label: '🌍 Publique',
    description: 'Lecture libre ; Réserver → auto viewer'
  }
} as const;

// ============================================================
// 📊 OPTIONS DE TRI - Pour les items de wishlist
// ============================================================
export const ITEM_SORT_OPTIONS = [
  { value: 'priority-desc', label: 'Priorité (haute → basse)', icon: '⭐' },
  { value: 'priority-asc', label: 'Priorité (basse → haute)', icon: '⭐' },
  { value: 'price-asc', label: 'Prix (croissant)', icon: '💰' },
  { value: 'price-desc', label: 'Prix (décroissant)', icon: '💰' },
  { value: 'name-asc', label: 'Nom (A → Z)', icon: '🔤' },
  { value: 'name-desc', label: 'Nom (Z → A)', icon: '🔤' },
  { value: 'date-desc', label: 'Plus récents', icon: '📅' },
  { value: 'date-asc', label: 'Plus anciens', icon: '📅' }
] as const;
