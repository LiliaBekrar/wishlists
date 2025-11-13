// 📄 FilterButtons.tsx
// 🧠 Rôle : Boutons de filtrage par statut (pour viewers)
import { FOCUS_RING } from '../utils/constants';

export type StatusFilter = 'tous' | 'disponible' | 'réservé' | 'acheté';

interface FilterButtonsProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
  counts: {
    tous: number;
    disponible: number;
    réservé: number;
    acheté: number;
  };
}

export default function FilterButtons({ value, onChange, counts }: FilterButtonsProps) {
  const filters: { value: StatusFilter; label: string; icon: string; color: string }[] = [
    { value: 'tous', label: 'Tous', icon: '🎁', color: 'gray' },
    { value: 'disponible', label: 'Disponibles', icon: '✨', color: 'green' },
    { value: 'réservé', label: 'Réservés', icon: '🔒', color: 'blue' },
    { value: 'acheté', label: 'Achetés', icon: '✅', color: 'purple' }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = value === filter.value;
        const count = counts[filter.value];

        return (
          <button
            key={filter.value}
            onClick={() => onChange(filter.value)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${FOCUS_RING} ${
              isActive
                ? filter.color === 'gray'
                  ? 'bg-gray-600 text-white shadow-lg'
                  : filter.color === 'green'
                  ? 'bg-green-600 text-white shadow-lg'
                  : filter.color === 'blue'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isActive
                ? 'bg-white/20'
                : filter.color === 'green'
                ? 'bg-green-50 text-green-700'
                : filter.color === 'blue'
                ? 'bg-blue-50 text-blue-700'
                : filter.color === 'purple'
                ? 'bg-purple-50 text-purple-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
