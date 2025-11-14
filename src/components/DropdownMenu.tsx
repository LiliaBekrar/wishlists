// 📄 DropdownMenu.tsx
// 🧠 Rôle : Menu contextuel SIMPLE avec positionnement relatif au bouton
// 🛠️ Auteur : Claude IA pour WishLists v7

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import type { ReactNode } from 'react';
import { FOCUS_RING } from '../utils/constants';

// ⚙️ Types
export interface DropdownAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface DropdownMenuProps {
  actions: DropdownAction[];
  ariaLabel?: string;
  className?: string;
}

export default function DropdownMenu({
  actions,
  ariaLabel = 'Menu options',
  className = '',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 🔒 Fermer au clic extérieur
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    // Petit délai pour éviter que le clic d'ouverture ferme immédiatement
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ⌨️ Navigation clavier
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {/* Bouton trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`p-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg transition-all ${FOCUS_RING}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div
          role="menu"
          onKeyDown={handleKeyDown}
          className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50"
        >
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (action.disabled) return;
                action.onClick();
                setIsOpen(false);
              }}
              disabled={action.disabled}
              role="menuitem"
              className={`
                w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-all
                ${
                  action.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                }
                ${
                  action.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }
                ${FOCUS_RING}
              `}
            >
              <span className="w-5 h-5 flex-shrink-0">{action.icon}</span>
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
