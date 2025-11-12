// 📄 useAuth.ts
// 🧠 Rôle : Hook authentification avec WORKAROUND RLS
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('📍 Session trouvée:', session.user.email);
          // ⬅️ WORKAROUND : On crée un "profile virtuel" depuis les données auth
          const virtualProfile = {
            id: session.user.id,
            email: session.user.email,
            pseudo: session.user.user_metadata?.pseudo || null,
            bio: null,
            avatar_url: session.user.user_metadata?.avatar_url || null,
            slug: null,
            is_public: false,
            notifications_enabled: true,
            created_at: session.user.created_at
          };

          console.log('✅ Profile virtuel créé:', virtualProfile);
          setUser(virtualProfile);
          setLoading(false);
        } else {
          console.log('📍 Pas de session');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Erreur init auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('📍 Auth event:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ SIGNED_IN:', session.user.email);

        // ⬅️ WORKAROUND : Profile virtuel au lieu de fetch DB
        const virtualProfile = {
          id: session.user.id,
          email: session.user.email,
          pseudo: session.user.user_metadata?.pseudo || null,
          bio: null,
          avatar_url: session.user.user_metadata?.avatar_url || null,
          slug: null,
          is_public: false,
          notifications_enabled: true,
          created_at: session.user.created_at
        };

        console.log('✅ Profile virtuel créé:', virtualProfile);
        setUser(virtualProfile);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 SIGNED_OUT');
        setUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 TOKEN_REFRESHED');
        const virtualProfile = {
          id: session.user.id,
          email: session.user.email,
          pseudo: session.user.user_metadata?.pseudo || null,
          bio: null,
          avatar_url: session.user.user_metadata?.avatar_url || null,
          slug: null,
          is_public: false,
          notifications_enabled: true,
          created_at: session.user.created_at
        };
        setUser(virtualProfile);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  const signInWithEmail = async (email: string) => {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log('📧 Envoi magic link à:', email);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      return { error };
    } catch (error) {
      console.error('❌ Erreur signInWithEmail:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('❌ Erreur signOut:', error);
    }
  };

  return { user, loading, signInWithEmail, signOut };
}
