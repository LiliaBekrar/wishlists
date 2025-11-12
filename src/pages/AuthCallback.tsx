// 📄 AuthCallback.tsx
// 🧠 Rôle : Page de retour après clic sur magic link
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [waited, setWaited] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (msg: string) => {
    console.log(msg);
    setDebugInfo(prev => [...prev, msg]);
  };

  useEffect(() => {
    addDebug('📍 AuthCallback monté');
    addDebug(`⏳ Loading: ${loading}`);
    addDebug(`👤 User: ${user ? user.email : 'null'}`);

    // Attendre minimum 2s pour que l'auth se fasse
    const timer = setTimeout(() => {
      addDebug('✅ Timer terminé (2s)');
      setWaited(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    addDebug(`📊 État: waited=${waited}, loading=${loading}, user=${user ? 'présent' : 'absent'}`);

    if (waited && !loading) {
      if (user) {
        addDebug('✅ Redirect vers /dashboard');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      } else {
        addDebug('❌ Pas de user, redirect vers login');
        setTimeout(() => {
          navigate('/?login=true', { replace: true });
        }, 500);
      }
    }
  }, [waited, loading, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Connexion en cours...
        </h1>
        <p className="text-gray-600 mb-4">
          Veuillez patienter quelques instants
        </p>

        {/* Debug info (visible uniquement en dev) */}
        <details className="mt-8 text-left bg-gray-100 p-4 rounded text-xs">
          <summary className="cursor-pointer font-mono font-bold mb-2">
            🐛 Debug Info (cliquer pour voir)
          </summary>
          <div className="space-y-1 font-mono text-gray-700">
            {debugInfo.map((info, i) => (
              <div key={i}>{info}</div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
