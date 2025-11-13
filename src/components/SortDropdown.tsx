// 📄 SortDropdown.tsx
// 🧠 Rôle : Dropdown de tri réutilisable
import { useState, useRef, useEffect } from 'react';
import { FOCUS_RING } from '../utils/constants';

export interface SortOption {
  value: string;
  label: string;
  icon?: string;
}

interface SortDropdownProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export default function SortDropdown({
  options,
  value,
  onChange,
  label = 'Trier par',
  className = ''
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = options.find(opt => opt.value === value);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>

      {/* Bouton dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-all ${FOCUS_RING} min-w-[180px]`}
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2">
          {currentOption?.icon && (
            <span className="text-base">{currentOption.icon}</span>
          )}
          <span className="font-medium text-sm">
            {currentOption?.label || 'Sélectionner'}
          </span>
        </div>

        {/* Icône chevron */}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-fade-in">
          <div
            className="py-1 max-h-64 overflow-y-auto"
            role="listbox"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-all ${
                  option.value === value
                    ? 'bg-purple-50 text-purple-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${FOCUS_RING}`}
                role="option"
                aria-selected={option.value === value}
              >
                {option.icon && (
                  <span className="text-base flex-shrink-0">{option.icon}</span>
                )}
                <span className="flex-1 text-left">{option.label}</span>

                {/* Checkmark si sélectionné */}
                {option.value === value && (
                  <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
