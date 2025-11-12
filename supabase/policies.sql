-- ============================================================
-- 📄 policies.sql
-- 🧠 Rôle : Politiques RLS pour WishLists v7
-- 🛠️ Auteur : Claude IA pour WishLists by Lilia
-- ============================================================

-- ⚠️ ACTIVER RLS SUR TOUTES LES TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 🧑 POLICIES : PROFILES
-- ============================================================

-- Tout le monde peut lire les profils publics (pseudo, avatar, bio)
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================
-- 🎁 POLICIES : WISHLISTS
-- ============================================================

-- SELECT : Lire les listes selon la visibilité
CREATE POLICY "Wishlists select based on visibility"
ON wishlists FOR SELECT
USING (
  -- Owner peut toujours voir
  owner_id = auth.uid()
  OR
  -- Publique : tout le monde
  visibility = 'publique'
  OR
  -- Partagée : tout le monde (lecture seule)
  visibility = 'partagée'
  OR
  -- Privée : owner + viewers
  (
    visibility = 'privée'
    AND EXISTS (
      SELECT 1 FROM wishlist_members
      WHERE wishlist_members.wishlist_id = wishlists.id
      AND wishlist_members.user_id = auth.uid()
      AND wishlist_members.role IN ('owner', 'viewer')
    )
  )
);

-- INSERT : Créer une liste (authentifié uniquement)
CREATE POLICY "Authenticated users can create wishlists"
ON wishlists FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- UPDATE : Modifier sa propre liste
CREATE POLICY "Owners can update their wishlists"
ON wishlists FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- DELETE : Supprimer sa propre liste
CREATE POLICY "Owners can delete their wishlists"
ON wishlists FOR DELETE
USING (owner_id = auth.uid());

-- ============================================================
-- 👥 POLICIES : WISHLIST_MEMBERS
-- ============================================================

-- SELECT : Voir les membres d'une liste si on y a accès
CREATE POLICY "Members are viewable by list participants"
ON wishlist_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = wishlist_members.wishlist_id
    AND (
      wishlists.owner_id = auth.uid()
      OR wishlists.visibility IN ('publique', 'partagée')
      OR EXISTS (
        SELECT 1 FROM wishlist_members wm2
        WHERE wm2.wishlist_id = wishlists.id
        AND wm2.user_id = auth.uid()
        AND wm2.role IN ('owner', 'viewer')
      )
    )
  )
);

-- INSERT : Owner peut ajouter des membres
CREATE POLICY "List owners can add members"
ON wishlist_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = wishlist_members.wishlist_id
    AND wishlists.owner_id = auth.uid()
  )
);

-- UPDATE : Owner peut modifier les rôles
CREATE POLICY "List owners can update members"
ON wishlist_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = wishlist_members.wishlist_id
    AND wishlists.owner_id = auth.uid()
  )
);

-- DELETE : Owner peut retirer des membres
CREATE POLICY "List owners can remove members"
ON wishlist_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = wishlist_members.wishlist_id
    AND wishlists.owner_id = auth.uid()
  )
);

-- ============================================================
-- 🎁 POLICIES : ITEMS
-- ============================================================

-- SELECT : Voir items si accès à la liste
CREATE POLICY "Items are viewable by list participants"
ON items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = items.wishlist_id
    AND (
      wishlists.owner_id = auth.uid()
      OR wishlists.visibility IN ('publique', 'partagée')
      OR EXISTS (
        SELECT 1 FROM wishlist_members
        WHERE wishlist_members.wishlist_id = wishlists.id
        AND wishlist_members.user_id = auth.uid()
        AND wishlist_members.role IN ('owner', 'viewer')
      )
    )
  )
);

-- INSERT : Owner de la liste peut ajouter des items
CREATE POLICY "List owners can add items"
ON items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = items.wishlist_id
    AND wishlists.owner_id = auth.uid()
  )
);

-- UPDATE : Owner de la liste peut modifier items
CREATE POLICY "List owners can update items"
ON items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = items.wishlist_id
    AND wishlists.owner_id = auth.uid()
  )
);

-- DELETE : Owner de la liste peut supprimer items
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
-- 🔒 POLICIES : CLAIMS (Réservations)
-- ============================================================

-- SELECT : Voir ses propres claims OU si owner de la liste (mais anonymisé)
CREATE POLICY "Users can view their own claims"
ON claims FOR SELECT
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM items
    JOIN wishlists ON wishlists.id = items.wishlist_id
    WHERE items.id = claims.item_id
    AND wishlists.owner_id = auth.uid()
  )
);

-- INSERT : Viewers peuvent réserver
CREATE POLICY "Viewers can create claims"
ON claims FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM items
    JOIN wishlists ON wishlists.id = items.wishlist_id
    WHERE items.id = claims.item_id
    AND (
      wishlists.visibility = 'publique'
      OR EXISTS (
        SELECT 1 FROM wishlist_members
        WHERE wishlist_members.wishlist_id = wishlists.id
        AND wishlist_members.user_id = auth.uid()
        AND wishlist_members.role = 'viewer'
      )
    )
  )
);

-- UPDATE : Utilisateur peut modifier ses propres claims
CREATE POLICY "Users can update their own claims"
ON claims FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE : Utilisateur peut supprimer ses propres claims
CREATE POLICY "Users can delete their own claims"
ON claims FOR DELETE
USING (user_id = auth.uid());

-- ============================================================
-- 💰 POLICIES : BUDGET_LIMITS
-- ============================================================

-- SELECT : Voir ses propres budgets
CREATE POLICY "Users can view their own budgets"
ON budget_limits FOR SELECT
USING (user_id = auth.uid());

-- INSERT : Créer ses propres budgets
CREATE POLICY "Users can create their own budgets"
ON budget_limits FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE : Modifier ses propres budgets
CREATE POLICY "Users can update their own budgets"
ON budget_limits FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE : Supprimer ses propres budgets
CREATE POLICY "Users can delete their own budgets"
ON budget_limits FOR DELETE
USING (user_id = auth.uid());

-- ============================================================
-- 💰 POLICIES : BUDGET_ITEMS
-- ============================================================

-- SELECT : Voir les items de ses budgets
CREATE POLICY "Users can view their budget items"
ON budget_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM budget_limits
    WHERE budget_limits.id = budget_items.budget_limit_id
    AND budget_limits.user_id = auth.uid()
  )
);

-- INSERT : Ajouter items à ses budgets
CREATE POLICY "Users can add items to their budgets"
ON budget_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM budget_limits
    WHERE budget_limits.id = budget_items.budget_limit_id
    AND budget_limits.user_id = auth.uid()
  )
);

-- DELETE : Retirer items de ses budgets
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
-- 🔔 POLICIES : NOTIFICATIONS_LOG (Lecture seule)
-- ============================================================

-- Pas d'accès direct pour les users
-- Seules les Edge Functions peuvent écrire
