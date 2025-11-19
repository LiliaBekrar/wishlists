/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/types/db.ts
// 🧠 Rôle : Types TypeScript de base


// ⚙️ PROFILES
export interface Profile {
  user_metadata: any;
  id: string;
  email: string;
  display_name: string;
  username: string;
  bio: string | null;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ⚙️ WISHLISTS
export interface Wishlist {
  id: string;
  owner_id: string;
  name: string; // ⬅️ Changé "title" → "name" (cohérent avec votre BDD)
  description: string | null;
  visibility: 'privée' | 'partagée' | 'publique';
  theme: 'noël' | 'anniversaire' | 'naissance' | 'mariage' | 'autre';
  slug: string;
  created_at: string;
  updated_at: string;

  // Relations (optionnelles selon requête)
  profiles?: Profile;
  items?: Item[];
  wishlist_members?: WishlistMember[];
}

// ⚙️ ITEMS
export interface Item {
  id: string;
  wishlist_id: string;
  title: string;
  description: string | null;
  price: number;
  url: string | null;
  image_url: string | null;
  priority: 'haute' | 'moyenne' | 'basse';
  status: 'disponible' | 'réservé';
  created_at: string;

  // Relations
  claims?: Claim[];
  wishlists?: Wishlist; // Pour accès au thème
}

// ⚙️ CLAIMS
export interface Claim {
  id: string;
  item_id: string;
  user_id: string;
  status: 'disponible' | 'réservé' | 'libéré'; // ⬅️ Ajout "disponible" (cohérent avec votre ENUM)
  paid_amount?: number; // ⬅️ NOUVEAU : prix réellement payé
  reserved_at: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  profiles?: Profile;
  items?: Item;
}

// ⚙️ WISHLIST_MEMBERS
export interface WishlistMember {
  wishlist_id: string;
  user_id: string;
  role: string;
  approved: boolean;
  status: 'invité' | 'en_attente' | 'actif' | 'refusé';
  email: string | null;
  requested_at: string | null;
  approved_at: string | null;
  joined_at: string | null;

  // Relations
  profiles?: Profile;
}

// ============================================
// 🆕 NOUVEAUX TYPES BUDGET
// ============================================

// ⚙️ EXTERNAL_RECIPIENTS (destinataires hors-app)
export interface ExternalRecipient {
  id: string;
  user_id: string;
  name: string;
  profile_id?: string; // NULL = hors-app, UUID = lié à un profil
  created_at: string;

  // Relations
  profiles?: Profile;
  external_gifts?: ExternalGift[];
}

// ⚙️ EXTERNAL_GIFTS (cadeaux hors-app)
export interface ExternalGift {
  id: string;
  user_id: string;
  recipient_id: string;
  description?: string;
  paid_amount: number;
  purchase_date: string;
  theme: 'noël' | 'anniversaire' | 'naissance' | 'mariage' | 'autre';
  notes?: string;
  created_at: string;

  // Relations
  external_recipients?: ExternalRecipient;
}

// ⚙️ BUDGET_GOALS (budgets auto + personnalisés)
export interface BudgetGoal {
  id: string;
  user_id: string;
  name: string;
  type: 'annuel' | 'noël' | 'anniversaire' | 'naissance' | 'mariage' | 'autre' | 'personnalisé';
  year?: number | null; // NULL pour budgets personnalisés
  limit_amount?: number | null; // NULL = illimité
  created_at: string;
  updated_at: string;
}

// ⚙️ BUDGET_ITEMS (liaisons drag & drop pour budgets personnalisés)
export interface BudgetItem {
  id: string;
  budget_id: string;
  claim_id?: string; // Cadeau in-app
  external_gift_id?: string; // Cadeau hors-app
  added_at: string;

  // Relations
  claims?: Claim;
  external_gifts?: ExternalGift;
}

// ⚙️ LIST_BUDGET_LIMITS (limites par liste)
export interface ListBudgetLimit {
  id: string;
  wishlist_id: string;
  user_id: string;
  limit_amount: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// TYPES DÉRIVÉS POUR L'UI
// ============================================

export interface BudgetData {
  budgetGoal: BudgetGoal;
  spent: number; // Total dépensé
  progress: number; // % (0-100+)
  threshold: 'green' | 'orange' | 'red'; // 🟢/🟠/🔴
  itemsCount: number; // Nombre de cadeaux
}

export interface DonutDataItem {
  name: string; // Nom personne/thème/liste
  value: number; // Montant en €
  percentage: number; // %
  color: string; // Couleur hexa
}

export type BudgetViewMode = 'global' | 'person' | 'theme' | 'list';

// ⚙️ TYPES UTILITAIRES
export type WishlistVisibility = 'privée' | 'partagée' | 'publique';
export type ItemPriority = 'haute' | 'moyenne' | 'basse';
export type ItemStatus = 'disponible' | 'réservé';
export type ClaimStatus = 'disponible' | 'réservé' | 'libéré';
export type MemberStatus = 'actif' | 'en_attente' | 'refusé';
export type UserRole = 'owner' | 'viewer' | 'visitor';
export type ThemeType = 'noël' | 'anniversaire' | 'naissance' | 'mariage' | 'autre';
export type BudgetType = 'annuel' | 'noël' | 'anniversaire' | 'naissance' | 'mariage' | 'autre' | 'personnalisé';
