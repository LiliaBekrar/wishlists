-- 📄 supabase/schema_triggers.sql
-- 🧠 Rôle : Fonction trigger pour auto-update updated_at

-- ==============================
-- FONCTION update_updated_at_column
-- ==============================
-- Cette fonction met à jour automatiquement le champ updated_at
-- lors d'un UPDATE sur n'importe quelle table

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS
  'Trigger function pour mettre à jour automatiquement updated_at sur UPDATE';
