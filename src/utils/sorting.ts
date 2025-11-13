// 📄 sorting.ts
// 🧠 Rôle : Fonctions de tri réutilisables
import type { Item } from '../hooks/useItems';
import type { StatusFilter } from '../components/FilterButtons';

const PRIORITY_ORDER = { 'haute': 3, 'moyenne': 2, 'basse': 1 };

export function sortItems(items: Item[], sortBy: string): Item[] {
  const sorted = [...items];

  switch (sortBy) {
    case 'priority-desc':
      return sorted.sort((a, b) =>
        PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
      );

    case 'priority-asc':
      return sorted.sort((a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      );

    case 'price-asc':
      return sorted.sort((a, b) =>
        (a.price || 0) - (b.price || 0)
      );

    case 'price-desc':
      return sorted.sort((a, b) =>
        (b.price || 0) - (a.price || 0)
      );

    case 'name-asc':
      return sorted.sort((a, b) =>
        a.title.localeCompare(b.title, 'fr')
      );

    case 'name-desc':
      return sorted.sort((a, b) =>
        b.title.localeCompare(a.title, 'fr')
      );

    case 'date-desc':
      return sorted.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    case 'date-asc':
      return sorted.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

    default:
      return sorted;
  }
}

// Fonction de filtrage par statut
export function filterItemsByStatus(items: Item[], statusFilter: StatusFilter): Item[] {
  if (statusFilter === 'tous') return items;
  return items.filter(item => item.status === statusFilter);
}
