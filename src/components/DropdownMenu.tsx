// 📄 DropdownMenu.tsx
import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import type { ReactNode } from 'react';
import { FOCUS_RING } from '../utils/constants';

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
  size?: 'sm' | 'md' | 'lg';
}

export default function DropdownMenu({
  actions,
  ariaLabel = 'Menu options',
  className = '',
  size = 'md',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // ⚙️ Classes de taille adaptatives
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2.5',
    lg: 'h-[42px] w-[42px] flex items-center justify-center', // ⬅️ Hauteur fixe
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`
          ${sizeClasses[size]}
          bg-gray-100 hover:bg-gray-200 active:bg-gray-300
          text-gray-700 rounded-lg transition-all
          ${FOCUS_RING}
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconSizeClasses[size]}
        >
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

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
