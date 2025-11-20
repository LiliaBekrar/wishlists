/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 Header.tsx
// 🧠 Rôle : Header moderne, responsive, avec avatar + cloche toujours visible

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { FOCUS_RING } from '../utils/constants';
import NotificationBadge from './NotificationBadge';

export default function Header() {
  const { user, signOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // 🆕 Infos issues de la table profiles
  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Charger display_name / username / avatar_url depuis profiles
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setProfileName(null);
        setAvatarUrl(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Erreur chargement profil Header:', error);
        setProfileName(null);
        setAvatarUrl(null);
        return;
      }

      const nameFromProfile =
        (data as any)?.display_name ||
        (data as any)?.username ||
        null;

      setProfileName(nameFromProfile);
      setAvatarUrl((data as any)?.avatar_url || null);
    };

    loadProfile();
  }, [user?.id]);

  // Nom affiché : priorité profil, puis email
  const displayName =
    profileName ||
    user?.email?.split('@')[0] ||
    'Mon compte';

  // Initiale fallback
  const initial = (displayName?.[0] || '?').toUpperCase();

  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barre principale */}
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo */}
          <Link
            to="/"
            className={`flex items-center gap-2 hover:opacity-90 transition-opacity ${FOCUS_RING}`}
            onClick={closeMobile}
          >
            <span className="text-3xl icon-bounce-active">🎁</span>
            <div className="flex flex-col leading-tight">
              <span className="text-xl icon-bounce-active font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                WishLists
              </span>
              <span className="text-xs text-gray-500 icon-bounce-active">
                by Lilia
              </span>
            </div>
          </Link>

          {/* Zone droite (desktop + mobile) */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* 🔔 Cloche TOUJOURS visible (desktop + mobile) */}
            <NotificationBadge />

            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`text-gray-700 hover:text-blue-600 font-medium ${FOCUS_RING} px-3 py-2 rounded-lg hover:bg-blue-50 transition-all`}
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/profile"
                    className={`text-gray-700 hover:text-blue-600 font-medium ${FOCUS_RING} px-3 py-2 rounded-lg hover:bg-blue-50 transition-all`}
                  >
                    Mon profil
                  </Link>

                  {/* Bloc user avec avatar OU initiale */}
                  <Link
                    to="/profile"
                    className={`flex items-center gap-3 px-3 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all ${FOCUS_RING}`}
                  >
                    <div className="w-9 h-9 rounded-full ring-2 ring-white shadow-md overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Votre avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-800 max-w-[140px] truncate">
                      {displayName}
                    </span>
                  </Link>

                  <button
                    onClick={signOut}
                    className={`bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-all ${FOCUS_RING}`}
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  to="/?login=true"
                  className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all ${FOCUS_RING}`}
                >
                  Connexion
                </Link>
              )}
            </nav>

            {/* Zone mobile (md:hidden) */}
            <div className="flex items-center gap-2 md:hidden">
              {user ? (
                <>
                  {/* Avatar mobile (avatar si existe, sinon initiale) */}
                  <Link
                    to="/profile"
                    onClick={closeMobile}
                    className={`${FOCUS_RING} rounded-full`}
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Votre avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                  </Link>

                  {/* Burger menu */}
                  <button
                    onClick={toggleMobile}
                    aria-label="Ouvrir le menu"
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white/70 hover:bg-gray-50 transition-all ${FOCUS_RING}`}
                  >
                    <span className="sr-only">Menu</span>
                    {isMobileOpen ? (
                      <span className="text-xl leading-none">✕</span>
                    ) : (
                      <span className="text-xl leading-none">☰</span>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleMobile}
                  aria-label="Ouvrir le menu"
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white/70 hover:bg-gray-50 transition-all ${FOCUS_RING}`}
                >
                  <span className="sr-only">Menu</span>
                  {isMobileOpen ? (
                    <span className="text-xl leading-none">✕</span>
                  ) : (
                    <span className="text-xl leading-none">☰</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {isMobileOpen && (
          <nav className="md:hidden border-t border-gray-200/70 pt-3 pb-4 flex flex-col gap-1">
            {user ? (
              <>
                <div className="flex items-center gap-3 mb-2 px-1">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Votre avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800">
                      {displayName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user?.email}
                    </span>
                  </div>
                </div>

                <Link
                  to="/dashboard"
                  onClick={closeMobile}
                  className={`px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all ${FOCUS_RING}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={closeMobile}
                  className={`px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all ${FOCUS_RING}`}
                >
                  Mon profil
                </Link>

                <button
                  onClick={() => {
                    closeMobile();
                    signOut();
                  }}
                  className={`mt-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-all text-left ${FOCUS_RING}`}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/?login=true"
                onClick={closeMobile}
                className={`mt-1 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all text-center ${FOCUS_RING}`}
              >
                Connexion
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
