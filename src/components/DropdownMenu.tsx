// 📄 DropdownMenu.tsx
// 🧠 Rôle : Menu contextuel générique (3 points) avec gestion clavier/A11y + portal (pas coupé par les cards)

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
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

interface MenuPosition {
  top: number;
  left: number;
}

export default function DropdownMenu({
  actions,
  ariaLabel = 'Menu options',
  className = '',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 📏 Calcule la position du menu par rapport au bouton
  const openMenu = () => {
    if (!buttonRef.current) {
      setIsOpen(true);
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();

    setMenuPosition({
      top: rect.bottom - 40, // px sous le bouton
      left: rect.right - 43,     // on s'aligne sur la droite du bouton
    });

    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // 🔒 Fermer au clic extérieur
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        wrapperRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      closeMenu();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ⌨️ Navigation clavier (Escape)
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeMenu();
      buttonRef.current?.focus();
    }
  };

  // 🧱 Contenu du menu (rendu dans un portal)
  const menuContent =
    isOpen && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            onKeyDown={handleKeyDown}
            style={{
              position: 'absolute',
              top: menuPosition.top,
              left: menuPosition.left,
              transform: 'translateX(-100%)', // aligner à droite du bouton
              zIndex: 9999,
            }}
            className="w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2"
          >
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (action.disabled) return;
                  action.onClick();
                  closeMenu();
                }}
                disabled={action.disabled}
                role="menuitem"
                className={`
                  w-full px-4 py-3 text-left flex items-center gap-3 transition-all
                  ${
                    action.variant === 'danger'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
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
          </div>,
          document.body
        )
      : null;

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {/* Bouton trigger */}
      <button
        ref={buttonRef}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all ${FOCUS_RING}`}
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

      {/* Menu dans un portal (hors des cards / overflow) */}
      {menuContent}
    </div>
  );
}
