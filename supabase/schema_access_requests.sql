-- 📄 supabase/schema_access_requests.sql
-- 🧠 Table des demandes d'accès (listes privées via lien + partagées)

-- ==============================
-- TABLE access_requests
-- ==============================
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Statut (en français)
  status TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (status IN ('en_attente', 'approuvée', 'refusée')),

  -- Message optionnel du demandeur
  message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contrainte unicité : 1 demande active par user/wishlist
  UNIQUE(wishlist_id, user_id)
);

-- Index performances
CREATE INDEX idx_access_requests_wishlist ON access_requests(wishlist_id);
CREATE INDEX idx_access_requests_user ON access_requests(user_id);
CREATE INDEX idx_access_requests_status ON access_requests(status);

-- ==============================
-- RLS POLICIES
-- ==============================
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Owner de la wishlist peut voir toutes les demandes
CREATE POLICY "Owner voit toutes demandes"
  ON access_requests FOR SELECT
  USING (
    wishlist_id IN (
      SELECT id FROM wishlists WHERE owner_id = auth.uid()
    )
  );

-- Demandeur peut voir ses propres demandes
CREATE POLICY "User voit ses demandes"
  ON access_requests FOR SELECT
  USING (user_id = auth.uid());

-- User authentifié peut créer une demande pour listes privées (lien) ou partagées
CREATE POLICY "User peut demander accès"
  ON access_requests FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND wishlist_id IN (
      SELECT id FROM wishlists
      WHERE visibility IN ('privée', 'partagée')
    )
  );

-- Owner peut update (approve/reject)
CREATE POLICY "Owner peut update demandes"
  ON access_requests FOR UPDATE
  USING (
    wishlist_id IN (
      SELECT id FROM wishlists WHERE owner_id = auth.uid()
    )
  );

-- Trigger mise à jour updated_at
CREATE TRIGGER update_access_requests_updated_at
  BEFORE UPDATE ON access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE access_requests IS 'Demandes d''accès aux listes privées (lien direct) et partagées';
