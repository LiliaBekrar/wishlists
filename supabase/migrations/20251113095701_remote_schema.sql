


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."claim_status" AS ENUM (
    'disponible',
    'réservé',
    'acheté',
    'libéré'
);


ALTER TYPE "public"."claim_status" OWNER TO "postgres";


CREATE TYPE "public"."priority_type" AS ENUM (
    'basse',
    'moyenne',
    'haute'
);


ALTER TYPE "public"."priority_type" OWNER TO "postgres";


CREATE TYPE "public"."theme_type" AS ENUM (
    'noël',
    'anniversaire',
    'naissance',
    'mariage',
    'autre'
);


ALTER TYPE "public"."theme_type" OWNER TO "postgres";


CREATE TYPE "public"."visibility_type" AS ENUM (
    'privée',
    'partagée',
    'publique'
);


ALTER TYPE "public"."visibility_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_unique_slug"("list_name" "text", "list_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := LOWER(TRIM(REGEXP_REPLACE(list_name, '[^a-z0-9]+', '-', 'gi'), '-'));
  base_slug := LEFT(base_slug, 50);
  final_slug := base_slug;
  
  WHILE EXISTS (
    SELECT 1 FROM wishlists 
    WHERE slug = final_slug AND id != list_id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;


ALTER FUNCTION "public"."generate_unique_slug"("list_name" "text", "list_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_wishlist_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_unique_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_wishlist_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_claim_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_claim_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_updated_at_column"() IS 'Trigger function pour mettre à jour automatiquement updated_at sur UPDATE';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."access_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wishlist_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'en_attente'::"text" NOT NULL,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "access_requests_status_check" CHECK (("status" = ANY (ARRAY['en_attente'::"text", 'approuvée'::"text", 'refusée'::"text"])))
);


ALTER TABLE "public"."access_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."access_requests" IS 'Demandes d''accès aux listes privées (lien direct) et partagées';



CREATE TABLE IF NOT EXISTS "public"."budget_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "year" integer,
    "theme" "public"."theme_type",
    "target_cents" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."budget_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_items" (
    "budget_id" "uuid" NOT NULL,
    "claim_id" "uuid" NOT NULL,
    "manual_paid_cents" integer,
    "order_index" integer DEFAULT 0
);


ALTER TABLE "public"."budget_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_limits" (
    "user_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "theme" "public"."theme_type" NOT NULL,
    "limit_cents" integer NOT NULL
);


ALTER TABLE "public"."budget_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "claimer_id" "uuid",
    "status" "public"."claim_status" DEFAULT 'disponible'::"public"."claim_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wishlist_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "url" "text",
    "image_url" "text",
    "price_cents" integer,
    "color" "text",
    "size" "text",
    "model" "text",
    "note" "text",
    "priority" "public"."priority_type" DEFAULT 'moyenne'::"public"."priority_type",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "promo_code" "text",
    "status" "text" DEFAULT 'disponible'::"text",
    "quantity" integer DEFAULT 1,
    "position" integer DEFAULT 0,
    CONSTRAINT "price_cents_positive" CHECK (("price_cents" >= 0)),
    CONSTRAINT "price_positive" CHECK (("price" >= (0)::numeric))
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "pseudo" "text",
    "bio" "text",
    "avatar_url" "text",
    "slug" "text",
    "is_public" boolean DEFAULT false,
    "notifications_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlist_members" (
    "wishlist_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'viewer'::"text",
    "approved" boolean DEFAULT false,
    "joined_via_link" boolean DEFAULT false,
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "approved_at" timestamp with time zone,
    "joined_at" timestamp with time zone
);


ALTER TABLE "public"."wishlist_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "theme" "public"."theme_type" DEFAULT 'autre'::"public"."theme_type",
    "visibility" "public"."visibility_type" DEFAULT 'privée'::"public"."visibility_type",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "slug" "text"
);


ALTER TABLE "public"."wishlists" OWNER TO "postgres";


ALTER TABLE ONLY "public"."access_requests"
    ADD CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."access_requests"
    ADD CONSTRAINT "access_requests_wishlist_id_user_id_key" UNIQUE ("wishlist_id", "user_id");



ALTER TABLE ONLY "public"."budget_goals"
    ADD CONSTRAINT "budget_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_items"
    ADD CONSTRAINT "budget_items_pkey" PRIMARY KEY ("budget_id", "claim_id");



ALTER TABLE ONLY "public"."budget_limits"
    ADD CONSTRAINT "budget_limits_pkey" PRIMARY KEY ("user_id", "year", "theme");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."wishlist_members"
    ADD CONSTRAINT "wishlist_members_pkey" PRIMARY KEY ("wishlist_id", "user_id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_slug_key" UNIQUE ("slug");



CREATE INDEX "idx_access_requests_status" ON "public"."access_requests" USING "btree" ("status");



CREATE INDEX "idx_access_requests_user" ON "public"."access_requests" USING "btree" ("user_id");



CREATE INDEX "idx_access_requests_wishlist" ON "public"."access_requests" USING "btree" ("wishlist_id");



CREATE INDEX "idx_budget_goals_owner" ON "public"."budget_goals" USING "btree" ("owner_id");



CREATE INDEX "idx_budget_items_budget" ON "public"."budget_items" USING "btree" ("budget_id");



CREATE INDEX "idx_budget_limits_user" ON "public"."budget_limits" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_claims_active_unique" ON "public"."claims" USING "btree" ("item_id") WHERE ("status" = ANY (ARRAY['réservé'::"public"."claim_status", 'acheté'::"public"."claim_status"]));



CREATE INDEX "idx_claims_claimer" ON "public"."claims" USING "btree" ("claimer_id");



CREATE INDEX "idx_claims_item" ON "public"."claims" USING "btree" ("item_id");



CREATE INDEX "idx_items_priority" ON "public"."items" USING "btree" ("priority");



CREATE INDEX "idx_items_wishlist" ON "public"."items" USING "btree" ("wishlist_id");



CREATE INDEX "idx_members_user" ON "public"."wishlist_members" USING "btree" ("user_id");



CREATE INDEX "idx_members_wishlist" ON "public"."wishlist_members" USING "btree" ("wishlist_id");



CREATE INDEX "idx_profiles_slug" ON "public"."profiles" USING "btree" ("slug") WHERE ("slug" IS NOT NULL);



CREATE INDEX "idx_wishlists_created_at" ON "public"."wishlists" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_wishlists_owner" ON "public"."wishlists" USING "btree" ("owner_id");



CREATE INDEX "idx_wishlists_slug" ON "public"."wishlists" USING "btree" ("slug");



CREATE INDEX "idx_wishlists_visibility" ON "public"."wishlists" USING "btree" ("visibility");



CREATE OR REPLACE TRIGGER "on_claim_update" BEFORE UPDATE ON "public"."claims" FOR EACH ROW EXECUTE FUNCTION "public"."update_claim_timestamp"();



CREATE OR REPLACE TRIGGER "set_wishlist_slug_trigger" BEFORE INSERT OR UPDATE OF "name" ON "public"."wishlists" FOR EACH ROW EXECUTE FUNCTION "public"."set_wishlist_slug"();



CREATE OR REPLACE TRIGGER "update_access_requests_updated_at" BEFORE UPDATE ON "public"."access_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "wishlists_updated_at" BEFORE UPDATE ON "public"."wishlists" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."access_requests"
    ADD CONSTRAINT "access_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."access_requests"
    ADD CONSTRAINT "access_requests_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_goals"
    ADD CONSTRAINT "budget_goals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_items"
    ADD CONSTRAINT "budget_items_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."budget_goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_items"
    ADD CONSTRAINT "budget_items_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_limits"
    ADD CONSTRAINT "budget_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_claimer_id_fkey" FOREIGN KEY ("claimer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist_members"
    ADD CONSTRAINT "wishlist_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist_members"
    ADD CONSTRAINT "wishlist_members_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Claimers can delete own claims" ON "public"."claims" FOR DELETE USING (("claimer_id" = "auth"."uid"()));



CREATE POLICY "Claimers can update own claims" ON "public"."claims" FOR UPDATE USING (("claimer_id" = "auth"."uid"()));



CREATE POLICY "Claims select policy" ON "public"."claims" FOR SELECT USING ((("claimer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."items"
     JOIN "public"."wishlists" ON (("wishlists"."id" = "items"."wishlist_id")))
  WHERE (("items"."id" = "claims"."item_id") AND (("wishlists"."owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."wishlist_members"
          WHERE (("wishlist_members"."wishlist_id" = "wishlists"."id") AND ("wishlist_members"."user_id" = "auth"."uid"()) AND ("wishlist_members"."approved" = true))))))))));



CREATE POLICY "Members delete policy" ON "public"."wishlist_members" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."wishlists"
  WHERE (("wishlists"."id" = "wishlist_members"."wishlist_id") AND ("wishlists"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Members select policy" ON "public"."wishlist_members" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."wishlists"
  WHERE (("wishlists"."id" = "wishlist_members"."wishlist_id") AND ("wishlists"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "Owner peut update demandes" ON "public"."access_requests" FOR UPDATE USING (("wishlist_id" IN ( SELECT "wishlists"."id"
   FROM "public"."wishlists"
  WHERE ("wishlists"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Owner voit toutes demandes" ON "public"."access_requests" FOR SELECT USING (("wishlist_id" IN ( SELECT "wishlists"."id"
   FROM "public"."wishlists"
  WHERE ("wishlists"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Owners can approve members" ON "public"."wishlist_members" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."wishlists"
  WHERE (("wishlists"."id" = "wishlist_members"."wishlist_id") AND ("wishlists"."owner_id" = "auth"."uid"())))));



CREATE POLICY "User peut demander accès" ON "public"."access_requests" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND ("wishlist_id" IN ( SELECT "wishlists"."id"
   FROM "public"."wishlists"
  WHERE ("wishlists"."visibility" = ANY (ARRAY['privée'::"public"."visibility_type", 'partagée'::"public"."visibility_type"]))))));



CREATE POLICY "User voit ses demandes" ON "public"."access_requests" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can request membership" ON "public"."wishlist_members" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users manage own budget goals" ON "public"."budget_goals" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users manage own budget items" ON "public"."budget_items" USING ((EXISTS ( SELECT 1
   FROM "public"."budget_goals"
  WHERE (("budget_goals"."id" = "budget_items"."budget_id") AND ("budget_goals"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."budget_goals"
  WHERE (("budget_goals"."id" = "budget_items"."budget_id") AND ("budget_goals"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users manage own budget limits" ON "public"."budget_limits" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Viewers can insert claims" ON "public"."claims" FOR INSERT WITH CHECK ((("claimer_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."items"
     JOIN "public"."wishlists" ON (("wishlists"."id" = "items"."wishlist_id")))
  WHERE (("items"."id" = "claims"."item_id") AND (("wishlists"."visibility" = 'publique'::"public"."visibility_type") OR (EXISTS ( SELECT 1
           FROM "public"."wishlist_members"
          WHERE (("wishlist_members"."wishlist_id" = "wishlists"."id") AND ("wishlist_members"."user_id" = "auth"."uid"()) AND ("wishlist_members"."approved" = true))))))))));



ALTER TABLE "public"."access_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "items_delete" ON "public"."items" FOR DELETE TO "authenticated" USING (("wishlist_id" IN ( SELECT "wishlists"."id"
   FROM "public"."wishlists"
  WHERE ("wishlists"."owner_id" = "auth"."uid"()))));



CREATE POLICY "items_insert" ON "public"."items" FOR INSERT TO "authenticated" WITH CHECK (("wishlist_id" IN ( SELECT "wishlists"."id"
   FROM "public"."wishlists"
  WHERE ("wishlists"."owner_id" = "auth"."uid"()))));



CREATE POLICY "items_select" ON "public"."items" FOR SELECT TO "authenticated" USING (("wishlist_id" IN ( SELECT "wishlists"."id"
   FROM "public"."wishlists"
  WHERE (("wishlists"."owner_id" = "auth"."uid"()) OR ("wishlists"."visibility" = 'publique'::"public"."visibility_type") OR ("wishlists"."visibility" = 'partagée'::"public"."visibility_type")))));



CREATE POLICY "items_update" ON "public"."items" FOR UPDATE TO "authenticated" USING (("wishlist_id" IN ( SELECT "wishlists"."id"
   FROM "public"."wishlists"
  WHERE ("wishlists"."owner_id" = "auth"."uid"())))) WITH CHECK (("wishlist_id" IN ( SELECT "wishlists"."id"
   FROM "public"."wishlists"
  WHERE ("wishlists"."owner_id" = "auth"."uid"()))));



ALTER TABLE "public"."wishlist_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wishlists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wishlists_delete" ON "public"."wishlists" FOR DELETE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "wishlists_insert" ON "public"."wishlists" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "wishlists_select" ON "public"."wishlists" FOR SELECT TO "authenticated" USING ((("owner_id" = "auth"."uid"()) OR ("visibility" = 'publique'::"public"."visibility_type") OR ("visibility" = 'partagée'::"public"."visibility_type")));



CREATE POLICY "wishlists_update" ON "public"."wishlists" FOR UPDATE TO "authenticated" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."items" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."wishlist_members" TO "authenticated";



GRANT ALL ON TABLE "public"."wishlists" TO "authenticated";


































drop extension if exists "pg_net";

revoke delete on table "public"."access_requests" from "anon";

revoke insert on table "public"."access_requests" from "anon";

revoke references on table "public"."access_requests" from "anon";

revoke select on table "public"."access_requests" from "anon";

revoke trigger on table "public"."access_requests" from "anon";

revoke truncate on table "public"."access_requests" from "anon";

revoke update on table "public"."access_requests" from "anon";

revoke delete on table "public"."access_requests" from "authenticated";

revoke insert on table "public"."access_requests" from "authenticated";

revoke references on table "public"."access_requests" from "authenticated";

revoke select on table "public"."access_requests" from "authenticated";

revoke trigger on table "public"."access_requests" from "authenticated";

revoke truncate on table "public"."access_requests" from "authenticated";

revoke update on table "public"."access_requests" from "authenticated";

revoke delete on table "public"."access_requests" from "service_role";

revoke insert on table "public"."access_requests" from "service_role";

revoke references on table "public"."access_requests" from "service_role";

revoke select on table "public"."access_requests" from "service_role";

revoke trigger on table "public"."access_requests" from "service_role";

revoke truncate on table "public"."access_requests" from "service_role";

revoke update on table "public"."access_requests" from "service_role";

revoke delete on table "public"."budget_goals" from "anon";

revoke insert on table "public"."budget_goals" from "anon";

revoke references on table "public"."budget_goals" from "anon";

revoke select on table "public"."budget_goals" from "anon";

revoke trigger on table "public"."budget_goals" from "anon";

revoke truncate on table "public"."budget_goals" from "anon";

revoke update on table "public"."budget_goals" from "anon";

revoke delete on table "public"."budget_goals" from "authenticated";

revoke insert on table "public"."budget_goals" from "authenticated";

revoke references on table "public"."budget_goals" from "authenticated";

revoke select on table "public"."budget_goals" from "authenticated";

revoke trigger on table "public"."budget_goals" from "authenticated";

revoke truncate on table "public"."budget_goals" from "authenticated";

revoke update on table "public"."budget_goals" from "authenticated";

revoke delete on table "public"."budget_goals" from "service_role";

revoke insert on table "public"."budget_goals" from "service_role";

revoke references on table "public"."budget_goals" from "service_role";

revoke select on table "public"."budget_goals" from "service_role";

revoke trigger on table "public"."budget_goals" from "service_role";

revoke truncate on table "public"."budget_goals" from "service_role";

revoke update on table "public"."budget_goals" from "service_role";

revoke delete on table "public"."budget_items" from "anon";

revoke insert on table "public"."budget_items" from "anon";

revoke references on table "public"."budget_items" from "anon";

revoke select on table "public"."budget_items" from "anon";

revoke trigger on table "public"."budget_items" from "anon";

revoke truncate on table "public"."budget_items" from "anon";

revoke update on table "public"."budget_items" from "anon";

revoke delete on table "public"."budget_items" from "authenticated";

revoke insert on table "public"."budget_items" from "authenticated";

revoke references on table "public"."budget_items" from "authenticated";

revoke select on table "public"."budget_items" from "authenticated";

revoke trigger on table "public"."budget_items" from "authenticated";

revoke truncate on table "public"."budget_items" from "authenticated";

revoke update on table "public"."budget_items" from "authenticated";

revoke delete on table "public"."budget_items" from "service_role";

revoke insert on table "public"."budget_items" from "service_role";

revoke references on table "public"."budget_items" from "service_role";

revoke select on table "public"."budget_items" from "service_role";

revoke trigger on table "public"."budget_items" from "service_role";

revoke truncate on table "public"."budget_items" from "service_role";

revoke update on table "public"."budget_items" from "service_role";

revoke delete on table "public"."budget_limits" from "anon";

revoke insert on table "public"."budget_limits" from "anon";

revoke references on table "public"."budget_limits" from "anon";

revoke select on table "public"."budget_limits" from "anon";

revoke trigger on table "public"."budget_limits" from "anon";

revoke truncate on table "public"."budget_limits" from "anon";

revoke update on table "public"."budget_limits" from "anon";

revoke delete on table "public"."budget_limits" from "authenticated";

revoke insert on table "public"."budget_limits" from "authenticated";

revoke references on table "public"."budget_limits" from "authenticated";

revoke select on table "public"."budget_limits" from "authenticated";

revoke trigger on table "public"."budget_limits" from "authenticated";

revoke truncate on table "public"."budget_limits" from "authenticated";

revoke update on table "public"."budget_limits" from "authenticated";

revoke delete on table "public"."budget_limits" from "service_role";

revoke insert on table "public"."budget_limits" from "service_role";

revoke references on table "public"."budget_limits" from "service_role";

revoke select on table "public"."budget_limits" from "service_role";

revoke trigger on table "public"."budget_limits" from "service_role";

revoke truncate on table "public"."budget_limits" from "service_role";

revoke update on table "public"."budget_limits" from "service_role";

revoke delete on table "public"."claims" from "anon";

revoke insert on table "public"."claims" from "anon";

revoke references on table "public"."claims" from "anon";

revoke select on table "public"."claims" from "anon";

revoke trigger on table "public"."claims" from "anon";

revoke truncate on table "public"."claims" from "anon";

revoke update on table "public"."claims" from "anon";

revoke delete on table "public"."claims" from "authenticated";

revoke insert on table "public"."claims" from "authenticated";

revoke references on table "public"."claims" from "authenticated";

revoke select on table "public"."claims" from "authenticated";

revoke trigger on table "public"."claims" from "authenticated";

revoke truncate on table "public"."claims" from "authenticated";

revoke update on table "public"."claims" from "authenticated";

revoke delete on table "public"."claims" from "service_role";

revoke insert on table "public"."claims" from "service_role";

revoke references on table "public"."claims" from "service_role";

revoke select on table "public"."claims" from "service_role";

revoke trigger on table "public"."claims" from "service_role";

revoke truncate on table "public"."claims" from "service_role";

revoke update on table "public"."claims" from "service_role";

revoke delete on table "public"."items" from "anon";

revoke insert on table "public"."items" from "anon";

revoke references on table "public"."items" from "anon";

revoke select on table "public"."items" from "anon";

revoke trigger on table "public"."items" from "anon";

revoke truncate on table "public"."items" from "anon";

revoke update on table "public"."items" from "anon";

revoke delete on table "public"."items" from "service_role";

revoke insert on table "public"."items" from "service_role";

revoke references on table "public"."items" from "service_role";

revoke select on table "public"."items" from "service_role";

revoke trigger on table "public"."items" from "service_role";

revoke truncate on table "public"."items" from "service_role";

revoke update on table "public"."items" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

revoke delete on table "public"."wishlist_members" from "anon";

revoke insert on table "public"."wishlist_members" from "anon";

revoke references on table "public"."wishlist_members" from "anon";

revoke select on table "public"."wishlist_members" from "anon";

revoke trigger on table "public"."wishlist_members" from "anon";

revoke truncate on table "public"."wishlist_members" from "anon";

revoke update on table "public"."wishlist_members" from "anon";

revoke references on table "public"."wishlist_members" from "authenticated";

revoke trigger on table "public"."wishlist_members" from "authenticated";

revoke truncate on table "public"."wishlist_members" from "authenticated";

revoke delete on table "public"."wishlist_members" from "service_role";

revoke insert on table "public"."wishlist_members" from "service_role";

revoke references on table "public"."wishlist_members" from "service_role";

revoke select on table "public"."wishlist_members" from "service_role";

revoke trigger on table "public"."wishlist_members" from "service_role";

revoke truncate on table "public"."wishlist_members" from "service_role";

revoke update on table "public"."wishlist_members" from "service_role";

revoke delete on table "public"."wishlists" from "anon";

revoke insert on table "public"."wishlists" from "anon";

revoke references on table "public"."wishlists" from "anon";

revoke select on table "public"."wishlists" from "anon";

revoke trigger on table "public"."wishlists" from "anon";

revoke truncate on table "public"."wishlists" from "anon";

revoke update on table "public"."wishlists" from "anon";

revoke delete on table "public"."wishlists" from "service_role";

revoke insert on table "public"."wishlists" from "service_role";

revoke references on table "public"."wishlists" from "service_role";

revoke select on table "public"."wishlists" from "service_role";

revoke trigger on table "public"."wishlists" from "service_role";

revoke truncate on table "public"."wishlists" from "service_role";

revoke update on table "public"."wishlists" from "service_role";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Item images are publicly accessible"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'wishlist-items'::text));



  create policy "Users can delete their own item images"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'wishlist-items'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can upload item images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'wishlist-items'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



