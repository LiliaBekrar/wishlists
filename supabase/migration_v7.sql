-- ============================================================
-- 📄 migration_v7.sql
-- 🧠 Rôle : Migration safe vers WishLists v7 (sans casser l'existant)
-- 🛠️ Auteur : Claude IA pour WishLists by Lilia
-- ============================================================

-- ============================================================
-- 🧑 PROFILES - Mise à jour si nécessaire
-- ============================================================
DO $$
BEGIN
  -- Ajouter colonne notifications_enabled si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'notifications_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Ajouter colonne bio si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  END IF;

  -- Ajouter colonne avatar_url si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Activer RLS si pas déjà fait
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 🎁 WISHLISTS - Mise à jour
-- ============================================================
DO $$
BEGIN
  -- Ajouter colonne description si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlists' AND column_name = 'description'
  ) THEN
    ALTER TABLE wishlists ADD COLUMN description TEXT CHECK (LENGTH(description) <= 500);
  END IF;

  -- Ajouter colonne theme si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlists' AND column_name = 'theme'
  ) THEN
    ALTER TABLE wishlists ADD COLUMN theme TEXT NOT NULL DEFAULT 'autre';
  END IF;

  -- Ajouter colonne visibility si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlists' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE wishlists ADD COLUMN visibility TEXT NOT NULL DEFAULT 'privée';
  END IF;

  -- Ajouter colonne slug si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlists' AND column_name = 'slug'
  ) THEN
    ALTER TABLE wishlists ADD COLUMN slug TEXT UNIQUE;
  END IF;
END $$;

-- Activer RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 🎁 ITEMS - Mise à jour COMPLÈTE
-- ============================================================
DO $$
BEGIN
  -- Ajouter colonne description si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'description'
  ) THEN
    ALTER TABLE items ADD COLUMN description TEXT CHECK (LENGTH(description) <= 1000);
  END IF;

  -- Ajouter colonne image_url si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE items ADD COLUMN image_url TEXT;
  END IF;

  -- Ajouter colonne price si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'price'
  ) THEN
    ALTER TABLE items ADD COLUMN price DECIMAL(10, 2) CHECK (price >= 0);
  END IF;

  -- Ajouter colonne priority si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'priority'
  ) THEN
    ALTER TABLE items ADD COLUMN priority TEXT DEFAULT 'moyenne';
  END IF;

  -- Ajouter colonne status si elle n'existe pas (⬅️ FIX ICI)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'status'
  ) THEN
    ALTER TABLE items ADD COLUMN status TEXT NOT NULL DEFAULT 'disponible';
  END IF;

  -- Ajouter colonne quantity si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE items ADD COLUMN quantity INTEGER DEFAULT 1 CHECK (quantity > 0);
  END IF;

  -- Ajouter colonne position si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'position'
  ) THEN
    ALTER TABLE items ADD COLUMN position INTEGER DEFAULT 0;
  END IF;

  -- Ajouter contraintes CHECK si pas déjà présentes
  -- Note: les contraintes CHECK ne peuvent pas être ajoutées conditionnellement facilement
  -- donc on les ignore si elles existent déjà (elles causeront une erreur silencieuse)
END $$;

-- Ajouter contraintes CHECK séparément (ignore erreur si existe)
DO $$
BEGIN
  ALTER TABLE items ADD CONSTRAINT items_priority_check CHECK (priority IN ('faible', 'moyenne', 'haute'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE items ADD CONSTRAINT items_status_check CHECK (status IN ('disponible', 'réservé', 'acheté', 'libéré'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Index items
CREATE INDEX IF NOT EXISTS idx_items_wishlist ON items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_priority ON items(priority);
CREATE INDEX IF NOT EXISTS idx_items_position ON items(wishlist_id, position);

-- Activer RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 📊 CRÉER LES INDEX S'ILS N'EXISTENT PAS
-- ============================================================

-- Index profiles
CREATE INDEX IF NOT EXISTS idx_profiles_pseudo ON profiles(pseudo);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Index wishlists
CREATE INDEX IF NOT EXISTS idx_wishlists_owner ON wishlists(owner_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_visibility ON wishlists(visibility);
CREATE INDEX IF NOT EXISTS idx_wishlists_slug ON wishlists(slug);
CREATE INDEX IF NOT EXISTS idx_wishlists_created_at ON wishlists(created_at DESC);

-- ============================================================
-- 🔧 FONCTIONS - Créer ou remplacer
-- ============================================================

-- Fonction pour générer un slug unique
CREATE OR REPLACE FUNCTION generate_unique_slug(list_name TEXT, list_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Générer slug de base (simplifié sans UNACCENT)
  base_slug := LOWER(TRIM(REGEXP_REPLACE(
    list_name,
    '[^a-z0-9]+',
    '-',
    'gi'
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

-- Fonction pour auto-générer le slug
CREATE OR REPLACE FUNCTION set_wishlist_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_unique_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 🎯 TRIGGERS - Créer ou remplacer
-- ============================================================

-- Trigger slug sur wishlists
DROP TRIGGER IF EXISTS set_wishlist_slug_trigger ON wishlists;
CREATE TRIGGER set_wishlist_slug_trigger
  BEFORE INSERT OR UPDATE OF name ON wishlists
  FOR EACH ROW EXECUTE FUNCTION set_wishlist_slug();

-- Trigger updated_at sur wishlists
DROP TRIGGER IF EXISTS wishlists_updated_at ON wishlists;
CREATE TRIGGER wishlists_updated_at
  BEFORE UPDATE ON wishlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger updated_at sur items
DROP TRIGGER IF EXISTS items_updated_at ON items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 🔐 POLICIES RLS - Supprimer les anciennes et recréer
-- ============================================================

-- PROFILES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- WISHLISTS
DROP POLICY IF EXISTS "Wishlists select based on visibility" ON wishlists;
DROP POLICY IF EXISTS "Authenticated users can create wishlists" ON wishlists;
DROP POLICY IF EXISTS "Owners can update their wishlists" ON wishlists;
DROP POLICY IF EXISTS "Owners can delete their wishlists" ON wishlists;

CREATE POLICY "Wishlists select based on visibility"
ON wishlists FOR SELECT
USING (
  owner_id = auth.uid()
  OR visibility = 'publique'
  OR visibility = 'partagée'
);

CREATE POLICY "Authenticated users can create wishlists"
ON wishlists FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their wishlists"
ON wishlists FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete their wishlists"
ON wishlists FOR DELETE
USING (owner_id = auth.uid());

-- ITEMS
DROP POLICY IF EXISTS "Items are viewable by list participants" ON items;
DROP POLICY IF EXISTS "List owners can add items" ON items;
DROP POLICY IF EXISTS "List owners can update items" ON items;
DROP POLICY IF EXISTS "List owners can delete items" ON items;

CREATE POLICY "Items are viewable by list participants"
ON items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = items.wishlist_id
    AND (
      wishlists.owner_id = auth.uid()
      OR wishlists.visibility IN ('publique', 'partagée')
    )
  )
);

CREATE POLICY "List owners can add items"
ON items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = items.wishlist_id
    AND wishlists.owner_id = auth.uid()
  )
);

CREATE POLICY "List owners can update items"
ON items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = items.wishlist_id
    AND wishlists.owner_id = auth.uid()
  )
);

CREATE POLICY "List owners can delete items"
ON items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = items.wishlist_id
    AND wishlists.owner_id = auth.uid()
  )
);

-- ============================================================
-- 🔒 CLAIMS - Vérifier existence table
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
  notes TEXT CHECK (LENGTH(notes) <= 500),
  UNIQUE(item_id, user_id)
);

-- Index claims
CREATE INDEX IF NOT EXISTS idx_claims_item ON claims(item_id);
CREATE INDEX IF NOT EXISTS idx_claims_user ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);

-- Activer RLS
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- CLAIMS policies
DROP POLICY IF EXISTS "Users can view their own claims" ON claims;
DROP POLICY IF EXISTS "Viewers can create claims" ON claims;
DROP POLICY IF EXISTS "Users can update their own claims" ON claims;
DROP POLICY IF EXISTS "Users can delete their own claims" ON claims;

CREATE POLICY "Users can view their own claims"
ON claims FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Viewers can create claims"
ON claims FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own claims"
ON claims FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own claims"
ON claims FOR DELETE
USING (user_id = auth.uid());

-- ============================================================
-- 💰 BUDGET_LIMITS & BUDGET_ITEMS - Créer si n'existent pas
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

CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_limit_id UUID NOT NULL REFERENCES budget_limits(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(claim_id)
);

-- Index budgets
CREATE INDEX IF NOT EXISTS idx_budget_limits_user ON budget_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_limits_theme ON budget_limits(theme);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items(budget_limit_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_claim ON budget_items(claim_id);

-- Activer RLS
ALTER TABLE budget_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- BUDGETS policies
DROP POLICY IF EXISTS "Users can view their own budgets" ON budget_limits;
DROP POLICY IF EXISTS "Users can create their own budgets" ON budget_limits;
DROP POLICY IF EXISTS "Users can update their own budgets" ON budget_limits;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON budget_limits;

CREATE POLICY "Users can view their own budgets"
ON budget_limits FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own budgets"
ON budget_limits FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own budgets"
ON budget_limits FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own budgets"
ON budget_limits FOR DELETE
USING (user_id = auth.uid());

-- BUDGET_ITEMS policies
DROP POLICY IF EXISTS "Users can view their budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can add items to their budgets" ON budget_items;
DROP POLICY IF EXISTS "Users can remove items from their budgets" ON budget_items;

CREATE POLICY "Users can view their budget items"
ON budget_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM budget_limits
    WHERE budget_limits.id = budget_items.budget_limit_id
    AND budget_limits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add items to their budgets"
ON budget_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM budget_limits
    WHERE budget_limits.id = budget_items.budget_limit_id
    AND budget_limits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove items from their budgets"
ON budget_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM budget_limits
    WHERE budget_limits.id = budget_items.budget_limit_id
    AND budget_limits.user_id = auth.uid()
  )
);

-- ============================================================
-- ✅ MIGRATION TERMINÉE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration v7 terminée avec succès !';
END $$;
