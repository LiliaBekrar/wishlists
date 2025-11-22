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
    colors: ['#7c3aed', '#ec4899', '#06b6d4'],
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
  xlarge: 500      // ⬅️ Très grande (landing pages spéciales)
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
    description: 'Seuls les membres approuvés peuvent voir et réserver'
  },
  partagée: {
    label: '🔗 Partagée',
    description: 'Tous les connectés voient, seuls les membres peuvent réserver'
  },
  publique: {
    label: '🌍 Publique',
    description: 'Tout le monde voit, les connectés peuvent réserver'
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

// ============================================================
// 💰 BUDGETS - Constantes pour la gestion des budgets
// ⚙️ Paramètres à personnaliser
// ============================================================

// Labels des types de budgets
export const BUDGET_TYPE_LABELS = {
  'annuel': '📅 Annuel',
  'noël': '🎄 Noël',
  'anniversaire': '🎂 Anniversaire',
  'naissance': '👶 Naissance',
  'mariage': '💍 Mariage',
  'autre': '🎁 Autre',
  'personnalisé': '✏️ Personnalisé'
} as const;

// Seuils de couleur pour les budgets (% utilisé)
export const BUDGET_THRESHOLDS = {
  GREEN: 90,  // < 90% → 🟢 Vert
  ORANGE: 100 // 90-99% → 🟠 Orange | ≥100% → 🔴 Rouge
}; // ⬅️ Modifiez ici pour ajuster les seuils

// Couleurs pour le donut chart (répartition par personne/thème/liste)
export const DONUT_COLORS = [
  '#3B82F6', // Bleu
  '#10B981', // Vert
  '#F59E0B', // Orange
  '#EF4444', // Rouge
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#14B8A6', // Teal
  '#F97316', // Orange foncé
  '#06B6D4', // Cyan
  '#84CC16', // Lime
]; // ⬅️ Modifiez ici pour changer les couleurs du donut

// Labels des thèmes (réutilisés depuis THEMES)
export const THEME_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(THEMES).map(([key, value]) => [key, value.label])
);

// Périodes des budgets automatiques (pour calculs et affichage)
// IMPORTANT : Toutes les périodes sont 1er janv → 31 déc (année civile)
export const BUDGET_PERIODS = {
  ANNUEL: {
    start: '01-01',
    end: '12-31',
    description: 'Année civile complète'
  }, // ⬅️ Annuel : 1er janv → 31 déc

  noël: {
    start: '01-01',
    end: '12-31',
    description: 'Tous les cadeaux Noël de l\'année'
  }, // ⬅️ Noël : 1er janv → 31 déc

  ANNIVERSAIRE: {
    start: '01-01',
    end: '12-31',
    description: 'Tous les cadeaux anniversaire de l\'année'
  }, // ⬅️ Anniversaire : 1er janv → 31 déc

  NAISSANCE: {
    start: '01-01',
    end: '12-31',
    description: 'Tous les cadeaux naissance de l\'année'
  }, // ⬅️ Naissance : 1er janv → 31 déc

  MARIAGE: {
    start: '01-01',
    end: '12-31',
    description: 'Tous les cadeaux mariage de l\'année'
  }, // ⬅️ Mariage : 1er janv → 31 déc

  AUTRE: {
    start: '01-01',
    end: '12-31',
    description: 'Tous les cadeaux "autre" de l\'année'
  }, // ⬅️ Autre : 1er janv → 31 déc
} as const;

// Mapping type budget → période (pour faciliter les calculs)
export const BUDGET_TYPE_TO_PERIOD: Record<string, keyof typeof BUDGET_PERIODS> = {
  'annuel': 'ANNUEL',
  'noël': 'noël',
  'anniversaire': 'ANNIVERSAIRE',
  'naissance': 'NAISSANCE',
  'mariage': 'MARIAGE',
  'autre': 'AUTRE'
};

// Limites de formulaires
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  RECIPIENT_NAME_MAX_LENGTH: 50,
  BUDGET_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
}; // ⬅️ Modifiez ici pour ajuster les validations


// ============================================================
// 📤 PARTAGE - Messages pour ShareModal
// ⚙️ Paramètres à personnaliser
// ============================================================
export const SHARE_MESSAGES = {
  publique: (listName: string, url: string) =>
    `🎁 ${listName}\n\nViens découvrir ma liste de souhaits ! 🎉\n\n${url}`,

  partagée: (listName: string, url: string) =>
    `🎁 ${listName}\n\nJe t'invite à rejoindre ma liste de souhaits !\n\nClique sur le lien pour demander l'accès :\n${url}`,

  privée: (listName: string, url: string) =>
    `🎁 ${listName}\n\nJe te partage ma liste privée 🔒\n\nClique sur le lien pour demander l'accès :\n${url}`,

  profile: (username: string, url: string) =>
    `👤 Découvre mon profil WishLists !\n\n@${username}\n\n${url}`,
} as const;

// ============================================================
// 🗑️ SUPPRESSION COMPTE - Messages de confirmation
// ⚙️ Paramètres à personnaliser
// ============================================================
export const DELETE_ACCOUNT_CONFIG = {
  CONFIRMATION_TEXT: 'SUPPRIMER',  // ⬅️ Texte à taper pour confirmer
  WARNING_MESSAGE: `⚠️ ATTENTION : Cette action est irréversible.\n\nToutes tes listes, réservations et données seront supprimées définitivement.\n\nTape "SUPPRIMER" pour confirmer.`,
} as const;

// ============================================================
// 📷 AVATAR - Config upload (NOUVEAU)
// ============================================================
export const AVATAR_CONFIG = {
  MAX_SIZE_MB: 2,
  MAX_SIZE_BYTES: 2 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  BUCKET_NAME: 'avatars',
} as const;
