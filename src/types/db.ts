/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/types/db.ts
// 🧠 Rôle : Types TypeScript de base


// ⚙️ PROFILES
export interface Profile {
  user_metadata: any;
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  username: string | null;
  bio: string | null;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ⚙️ WISHLISTS
export interface Wishlist {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  visibility: 'privée' | 'partagée' | 'publique'; // ⬅️ Français correct
  theme: 'noel' | 'anniversaire' | 'naissance' | 'mariage' | 'autre';
  event_date: string | null;
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
  price: number | null;
  currency: string;
  url: string | null;
  image_url: string | null;
  priority: 'haute' | 'moyenne' | 'basse'; // ⬅️ Français correct
  status: 'disponible' | 'réservé' | 'acheté'; // ⬅️ Français correct
  created_at: string;
  updated_at: string;

  // Relations
  claims?: Claim[];
}

// ⚙️ CLAIMS
export interface Claim {
  id: string;
  item_id: string;
  user_id: string;
  status: 'réservé' | 'acheté' | 'libéré'; // ⬅️ Français correct
  purchased_at: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  profiles?: Profile;
  items?: Item;
}

// ⚙️ WISHLIST_MEMBERS
export interface WishlistMember {
  id: string;
  wishlist_id: string;
  user_id: string | null; // null si invité non inscrit
  email: string;
  role: 'viewer' | 'editor'; // editor pour future extension
  status: 'actif' | 'invité' | 'en_attente'; // ⬅️ Français correct
  created_at: string;

  // Relations
  profiles?: Profile;
}

// ⚙️ ACCESS_REQUESTS
export interface AccessRequest {
  id: string;
  wishlist_id: string;
  user_id: string;
  status: 'en_attente' | 'approuvée' | 'refusée'; // ⬅️ Français correct
  message: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  profiles?: Profile;
  wishlists?: Wishlist;
}

// ⚙️ BUDGET_LIMITS (budgets manuels)
export interface BudgetLimit {
  id: string;
  user_id: string;
  name: string;
  limit_amount: number | null; // null = pas de limite
  currency: string;
  created_at: string;
  updated_at: string;

  // Relations
  budget_items?: BudgetItem[];
}

// ⚙️ BUDGET_ITEMS (affectation claims → budgets)
export interface BudgetItem {
  id: string;
  budget_id: string;
  claim_id: string;
  created_at: string;

  // Relations
  claims?: Claim;
  budget_limits?: BudgetLimit;
}

// ⚙️ BUDGET_GOALS (budgets automatiques)
export interface BudgetGoal {
  id: string;
  user_id: string;
  year: number;
  type: 'annuel' | 'noel' | 'anniversaire' | 'naissance' | 'mariage'; // ⬅️ Types auto
  limit_amount: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

// ⚙️ TYPES UTILITAIRES
export type WishlistVisibility = 'privée' | 'partagée' | 'publique';
export type ItemPriority = 'haute' | 'moyenne' | 'basse';
export type ItemStatus = 'disponible' | 'réservé' | 'acheté';
export type ClaimStatus = 'réservé' | 'acheté' | 'libéré';
export type MemberStatus = 'actif' | 'invité' | 'en_attente';
export type AccessRequestStatus = 'en_attente' | 'approuvée' | 'refusée';
export type UserRole = 'owner' | 'viewer' | 'visitor';
export type ThemeType = 'noël' | 'anniversaire' | 'naissance' | 'mariage' | 'autre';
