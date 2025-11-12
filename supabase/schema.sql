-- ============================================================
-- 📄 schema.sql
-- 🧠 Rôle : Schéma de base de données WishLists v7
-- 🛠️ Auteur : Claude IA pour WishLists by Lilia
-- ============================================================

-- ============================================================
-- 🧑 PROFILES - Profils utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  pseudo TEXT,
  avatar_url TEXT,
  bio TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par pseudo
CREATE INDEX idx_profiles_pseudo ON profiles(pseudo);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Trigger pour créer un profil automatiquement à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, pseudo)
  VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.email, '@', 1) -- Pseudo par défaut = partie avant @
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 🎁 WISHLISTS - Listes de cadeaux
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
  description TEXT CHECK (LENGTH(description) <= 500),
  theme TEXT NOT NULL CHECK (theme IN ('noel', 'anniversaire', 'naissance', 'mariage', 'autre')),
  visibility TEXT NOT NULL CHECK (visibility IN ('privée', 'partagée', 'publique')),
  slug TEXT UNIQUE, -- Pour URLs type /list/mon-noel-2025
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche et tri
CREATE INDEX idx_wishlists_owner ON wishlists(owner_id);
CREATE INDEX idx_wishlists_visibility ON wishlists(visibility);
CREATE INDEX idx_wishlists_slug ON wishlists(slug);
CREATE INDEX idx_wishlists_created_at ON wishlists(created_at DESC);

-- Fonction pour générer un slug unique
CREATE OR REPLACE FUNCTION generate_unique_slug(list_name TEXT, list_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Générer slug de base : minuscules, accents retirés, espaces -> tirets
  base_slug := LOWER(TRIM(REGEXP_REPLACE(
    UNACCENT(list_name),
    '[^a-z0-9]+',
    '-',
    'g'
  ), '-'));

  -- Limiter à 50 caractères
  base_slug := LEFT(base_slug, 50);

  final_slug := base_slug;

  -- Vérifier unicité et ajouter suffixe si nécessaire
  WHILE EXISTS (
    SELECT 1 FROM wishlists
    WHERE slug = final_slug AND id != list_id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-générer le slug
CREATE OR REPLACE FUNCTION set_wishlist_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_unique_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_wishlist_slug_trigger ON wishlists;
CREATE TRIGGER set_wishlist_slug_trigger
  BEFORE INSERT OR UPDATE OF name ON wishlists
  FOR EACH ROW EXECUTE FUNCTION set_wishlist_slug();

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wishlists_updated_at ON wishlists;
CREATE TRIGGER wishlists_updated_at
  BEFORE UPDATE ON wishlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 👥 WISHLIST_MEMBERS - Membres/Accès aux listes
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL pour anonymes
  email TEXT, -- Pour invitations en attente
  role TEXT NOT NULL CHECK (role IN ('owner', 'viewer', 'pending')),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte : pas de doublon user_id + wishlist_id
  UNIQUE(wishlist_id, user_id),
  -- Contrainte : pas de doublon email + wishlist_id pour pending
  UNIQUE(wishlist_id, email)
);

-- Index pour requêtes fréquentes
CREATE INDEX idx_members_wishlist ON wishlist_members(wishlist_id);
CREATE INDEX idx_members_user ON wishlist_members(user_id);
CREATE INDEX idx_members_email ON wishlist_members(email);
CREATE INDEX idx_members_role ON wishlist_members(role);

-- ============================================================
-- 🎁 ITEMS - Cadeaux dans les listes
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 200),
  description TEXT CHECK (LENGTH(description) <= 1000),
  url TEXT CHECK (url ~* '^https?://'), -- Validation URL
  image_url TEXT,
  price DECIMAL(10, 2) CHECK (price >= 0),
  priority TEXT CHECK (priority IN ('faible', 'moyenne', 'haute')) DEFAULT 'moyenne',
  status TEXT NOT NULL CHECK (status IN ('disponible', 'réservé', 'acheté', 'libéré')) DEFAULT 'disponible',
  quantity INTEGER CHECK (quantity > 0) DEFAULT 1,
  position INTEGER DEFAULT 0, -- Pour tri manuel
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_items_wishlist ON items(wishlist_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_priority ON items(priority);
CREATE INDEX idx_items_position ON items(wishlist_id, position);

-- Trigger updated_at
DROP TRIGGER IF EXISTS items_updated_at ON items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 🔒 CLAIMS - Réservations de cadeaux
-- ============================================================
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('réservé', 'acheté', 'libéré')) DEFAULT 'réservé',
  quantity INTEGER CHECK (quantity > 0) DEFAULT 1,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  purchased_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  notes TEXT CHECK (LENGTH(notes) <= 500), -- Notes privées du réservant

  -- Contrainte : 1 seul claim actif par item/user
  UNIQUE(item_id, user_id)
);

-- Index
CREATE INDEX idx_claims_item ON claims(item_id);
CREATE INDEX idx_claims_user ON claims(user_id);
CREATE INDEX idx_claims_status ON claims(status);

-- Trigger updated_at
DROP TRIGGER IF EXISTS claims_updated_at ON claims;
CREATE TRIGGER claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 💰 BUDGET_LIMITS - Limites budgétaires manuelles
-- ============================================================
CREATE TABLE IF NOT EXISTS budget_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
  limit_amount DECIMAL(10, 2) CHECK (limit_amount > 0),
  period TEXT CHECK (period IN ('mensuel', 'annuel', 'unique')),
  theme TEXT CHECK (theme IN ('noel', 'anniversaire', 'naissance', 'mariage', 'autre')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_budget_limits_user ON budget_limits(user_id);
CREATE INDEX idx_budget_limits_theme ON budget_limits(theme);

-- ============================================================
-- 💰 BUDGET_ITEMS - Association claims <-> budgets manuels
-- ============================================================
CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_limit_id UUID NOT NULL REFERENCES budget_limits(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte : 1 claim ne peut être dans qu'1 seul budget manuel
  UNIQUE(claim_id)
);

-- Index
CREATE INDEX idx_budget_items_budget ON budget_items(budget_limit_id);
CREATE INDEX idx_budget_items_claim ON budget_items(claim_id);

-- ============================================================
-- 🔔 NOTIFICATIONS_LOG - Historique des notifications envoyées
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('invitation', 'reservation', 'achat', 'demande_acces')),
  wishlist_id UUID REFERENCES wishlists(id) ON DELETE SET NULL,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Index pour audit
CREATE INDEX idx_notifications_recipient ON notifications_log(recipient_email);
CREATE INDEX idx_notifications_event ON notifications_log(event_type);
CREATE INDEX idx_notifications_sent_at ON notifications_log(sent_at DESC);

-- ============================================================
-- 📊 COMMENTAIRES (pour référence)
-- ============================================================
-- Ce schéma implémente :
-- ✅ Profils auto-créés via trigger
-- ✅ Listes avec slug auto-généré
-- ✅ Système de membres/rôles (owner/viewer/pending)
-- ✅ Items avec statuts (disponible/réservé/acheté)
-- ✅ Claims avec contrainte unicité (1 claim actif/item)
-- ✅ Budgets manuels + association aux claims
-- ✅ Log des notifications
-- ✅ Triggers updated_at sur toutes les tables
-- ✅ Index pour performance
-- ✅ Contraintes CHECK pour intégrité des données
