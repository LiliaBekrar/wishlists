// 📄 src/pages/list-view/ListViewContent.tsx
// 🧠 Rôle : Contenu principal avec tri, filtres et items

import { useState } from 'react';
import { FOCUS_RING, ITEM_SORT_OPTIONS } from '../../utils/constants';
import { sortItems, filterItemsByStatus } from '../../utils/sorting';
import type { Wishlist } from '../../hooks/useWishlists';
import type { Item } from '../../hooks/useItems';
import type { StatusFilter } from '../../components/FilterButtons';
import SortDropdown from '../../components/SortDropdown';
import FilterButtons from '../../components/FilterButtons';
import AddItemModal from '../../components/Items/AddItemModal';
import ItemCard from '../../components/Items/ItemCard';
import ListStats from '../../components/Lists/ListStats';
import OwnerStats from '../../components/OwnerStats';
import { useItems } from '../../hooks/useItems';
import { supabase } from '../../lib/supabaseClient'; // ⬅️ AJOUT

interface Props {
  wishlist: Wishlist;
  items: Item[];
  isOwner: boolean;
  canClaim: boolean;
  onToast: (toast: { message: string; type: 'success' | 'error' }) => void;
}

export default function ListViewContent({
  wishlist,
  items,
  isOwner,
  canClaim,
  onToast,
}: Props) {
  const { createItem } = useItems(wishlist.id);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ⬅️ AJOUT : Modal d'édition
  const [editModal, setEditModal] = useState<{ open: boolean; item: Item | null }>({
    open: false,
    item: null,
  });

  const [sortBy, setSortBy] = useState('priority-desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('tous');

  // Filtrer puis trier
  const filteredItems = filterItemsByStatus(items, statusFilter);
  const sortedItems = sortItems(filteredItems, sortBy);

  // Compter par statut
  const statusCounts = {
    tous: items.length,
    disponible: items.filter((i) => i.status === 'disponible').length,
    réservé: items.filter((i) => i.status === 'réservé').length,
    acheté: items.filter((i) => i.status === 'acheté').length,
  };

  // Handler ajout item
  const handleAddItem = async (data: {
    name: string;
    description: string;
    url: string;
    image_url: string;
    price: number;
    priority: 'basse' | 'moyenne' | 'haute';
    size: string;
    color: string;
    promo_code: string;
  }) => {
    try {
      await createItem(data);
      onToast({ message: '✅ Cadeau ajouté avec succès !', type: 'success' });
    } catch (error) {
      console.error('❌ Erreur:', error);
      onToast({ message: "❌ Erreur lors de l'ajout", type: 'error' });
    }
  };

  // ⬅️ AJOUT : Handler édition item
  const handleEditItem = async (data: {
    name: string;
    description: string;
    url: string;
    image_url: string;
    price: number;
    priority: 'basse' | 'moyenne' | 'haute';
    size: string;
    color: string;
    promo_code: string;
  }) => {
    if (!editModal.item) return;

    try {
      const { error } = await supabase
        .from('items')
        .update({
          title: data.name,
          note: data.description,
          url: data.url,
          image_url: data.image_url,
          price: data.price,
          priority: data.priority,
          size: data.size,
          color: data.color,
          promo_code: data.promo_code,
        })
        .eq('id', editModal.item.id);

      if (error) throw error;

      onToast({ message: '✅ Cadeau modifié !', type: 'success' });
      setEditModal({ open: false, item: null });

      // Recharger la page pour voir les changements
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('❌ Erreur:', error);
      onToast({ message: '❌ Erreur lors de la modification', type: 'error' });
    }
  };

  // ⬅️ AJOUT : Handler suppression item
  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from('items').delete().eq('id', itemId);

      if (error) throw error;

      onToast({ message: '✅ Cadeau supprimé', type: 'success' });

      // Recharger la page
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('❌ Erreur:', error);
      onToast({ message: '❌ Erreur lors de la suppression', type: 'error' });
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-16 relative z-10">
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          {/* Header actions */}
          <div className="flex flex-col gap-4 mb-8 pb-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Cadeaux de la liste</h2>
                <p className="text-gray-600 text-sm">
                  {sortedItems.length} / {items.length} cadeau{items.length > 1 ? 'x' : ''}
                </p>
              </div>

              {isOwner && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all ${FOCUS_RING} whitespace-nowrap`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Ajouter un cadeau</span>
                  <span className="sm:hidden">Ajouter</span>
                </button>
              )}
            </div>

            {items.length > 0 && (
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {!isOwner && (
                  <div className="flex-1">
                    <FilterButtons
                      value={statusFilter}
                      onChange={setStatusFilter}
                      counts={statusCounts}
                    />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 font-medium whitespace-nowrap">Trier par :</span>
                  <SortDropdown options={ITEM_SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
                </div>
              </div>
            )}
          </div>

          {/* Liste items */}
          {sortedItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">{items.length === 0 ? '🎁' : '🔍'}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {items.length === 0 ? 'Aucun cadeau pour le moment' : 'Aucun résultat'}
              </h3>
              <p className="text-gray-600 mb-6">
                {items.length === 0
                  ? isOwner
                    ? 'Commence à ajouter tes envies de cadeaux !'
                    : "Le propriétaire de la liste n'a pas encore ajouté de cadeaux."
                  : 'Essaie de changer les filtres ou le tri.'}
              </p>
              {isOwner && items.length === 0 && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all ${FOCUS_RING}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Ajouter mon premier cadeau</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {sortedItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isOwner={isOwner}
                  canClaim={canClaim}
                  wishlistId={wishlist.id}
                  onDelete={handleDeleteItem} // ⬅️ AJOUT
                  onEdit={(item) => setEditModal({ open: true, item })} // ⬅️ AJOUT
                />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-6">{isOwner ? <OwnerStats items={items} /> : <ListStats items={items} />}</div>
        )}
      </div>

      {/* Modal ajout */}
      <AddItemModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddItem} />

      {/* ⬅️ AJOUT : Modal édition */}
      {editModal.item && (
        <AddItemModal
          isOpen={editModal.open}
          onClose={() => setEditModal({ open: false, item: null })}
          onSubmit={handleEditItem}
          editMode={true}
          initialData={{
            name: editModal.item.title,
            description: editModal.item.note || '',
            url: editModal.item.url || '',
            image_url: editModal.item.image_url || '',
            price: editModal.item.price,
            priority: editModal.item.priority,
            size: editModal.item.size || '',
            color: editModal.item.color || '',
            promo_code: editModal.item.promo_code || '',
          }}
        />
      )}
    </>
  );
}
