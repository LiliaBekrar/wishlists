// 📄 Toast.tsx
// 🧠 Rôle : Notifications toast (succès/erreur)
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  return (
    <div
      className={`fixed top-4 right-4 z-5000 p-4 rounded-lg border-2 shadow-lg animate-fade-in ${colors[type]} max-w-md`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icons[type]}</span>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
