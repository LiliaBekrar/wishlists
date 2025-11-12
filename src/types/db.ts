// 📄 src/types/db.ts
// 🧠 Rôle : Types TypeScript de base
export interface Profile {
  id: string;
  email: string;
  pseudo: string | null;
  avatar_url: string | null;
  slug: string | null;
  is_public: boolean;
  notifications_enabled: boolean;
  created_at: string;
}

export type ThemeType = 'noël' | 'anniversaire' | 'naissance' | 'mariage' | 'autre';
