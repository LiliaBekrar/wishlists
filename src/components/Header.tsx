// 📄 Header.tsx
// 🧠 Rôle : Header moderne avec glassmorphism
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FOCUS_RING } from '../utils/constants';
import NotificationBadge from './NotificationBadge';

export default function Header() {
  const { user, signOut } = useAuth();
  const displayName =
    user?.display_name || user?.username || user?.email.split('@')[0];

  const initial =
    (user?.display_name?.[0] ||
      user?.username?.[0] ||
      user?.email[0] ||
      '?'
    ).toUpperCase();


  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ⬅️ h-auto + py pour permettre au header de grandir si ça wrap */}
        <div className="flex justify-between items-center gap-3 py-2">
          {/* Logo */}
          <Link
            to="/"
            className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${FOCUS_RING}`}
          >
            <span className="text-3xl animate-swing">🎁</span>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                WishLists
              </span>
              <span className="text-xs text-gray-500">by Lilia</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`text-gray-700 hover:text-blue-600 font-medium ${FOCUS_RING} px-4 py-2 rounded-lg hover:bg-blue-50 transition-all`}
                >
                  Dashboard
                </Link>

                <NotificationBadge />

                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                    {initial}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {displayName}
                  </span>
                </div>

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
        </div>
      </div>
    </header>
  );
}
