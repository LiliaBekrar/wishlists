/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 useAuth.ts
// 🧠 Rôle : Hook d'auth avec "virtual profile" (RLS-friendly) et email toujours string

import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "../store/authStore";
import type { User } from "@supabase/supabase-js";

// 👉 Si tu as déjà un type généré (Tables<"profiles">), importe-le à la place :
type Profile = {
  id: string;
  email: string; // 🚨 non-nullable par choix produit
  pseudo: string | null;
  bio: string | null;
  avatar_url: string | null;
  slug: string | null;
  is_public: boolean;
  notifications_enabled: boolean;
  created_at: string;
};

// Fallback unique et centralisé pour garantir un email string
const safeEmail = (email?: string) => email ?? "no-email@wishlists.app";

// Construit un "profile virtuel" cohérent avec ton schéma
function buildVirtualProfile(user: User): Profile {
  return {
    id: user.id,
    email: safeEmail(user.email), // ✅ jamais undefined
    pseudo: (user.user_metadata as any)?.pseudo ?? null,
    bio: null,
    avatar_url: (user.user_metadata as any)?.avatar_url ?? null,
    slug: null,
    is_public: false,
    notifications_enabled: true,
    created_at: user.created_at, // string ISO
  };
}

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          console.log("📍 Session trouvée:", session.user.email);
          const virtualProfile = buildVirtualProfile(session.user);
          console.log("✅ Profile virtuel créé:", virtualProfile);
          setUser(virtualProfile); // ← Profile
        }
      } catch (error) {
        console.error("❌ Erreur init auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("📍 Auth event:", event);

        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
          const virtualProfile = buildVirtualProfile(session.user);
          console.log("✅ Profile virtuel créé:", virtualProfile);
          setUser(virtualProfile);
          setLoading(false);
          return;
        }

        if (event === "SIGNED_OUT") {
          console.log("👋 SIGNED_OUT");
          setUser(null);
          setLoading(false);
          return;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  const signInWithEmail = async (email: string) => {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log("📧 Envoi magic link à:", email);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      return { error };
    } catch (e) {
      console.error("❌ Erreur signInWithEmail:", e);
      // on renvoie une structure homogène
      return { error: e as unknown as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (e) {
      console.error("❌ Erreur signOut:", e);
    }
  };

  return { user, loading, signInWithEmail, signOut };
}
