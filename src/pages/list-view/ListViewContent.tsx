/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/pages/list-view/ListViewContent.tsx
// 🧠 Rôle : Contenu principal avec messages pour partagée (guest) et publique (non connecté)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  wishlist: Wishlist;
  items: Item[];
  isOwner: boolean;
  canClaim: boolean;
  onToast: (toast: { message: string; type: 'success' | 'error' }) => void;
  onRequestAccess: () => Promise<void>;
  onAddItem: (data: {
    name: string;
    description: string;
    url: string;
    image_url: string;
    price: number;
    priority: 'basse' | 'moyenne' | 'haute';
    size: string;
    color: string;
    promo_code: string;
  }) => Promise<any>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onRefetchItems: () => Promise<void>;
}

export default function ListViewContent({
  wishlist,
  items,
  isOwner,
  canClaim,
  onToast,
  onRequestAccess,
  onAddItem,
  onDeleteItem,
  onRefetchItems,
}: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [editModal, setEditModal] = useState<{ open: boolean; item: Item | null }>({
    open: false,
    item: null,
  });

  const [sortBy, setSortBy] = useState('priority-desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('tous');

  const filteredItems = filterItemsByStatus(items, statusFilter);
  const sortedItems = sortItems(filteredItems, sortBy);

  const statusCounts = {
    tous: items.length,
    disponible: items.filter((i) => i.status === 'disponible').length,
    réservé: items.filter((i) => i.status === 'réservé').length,
  };

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
      await onAddItem(data);
      onToast({ message: '✅ Cadeau ajouté avec succès !', type: 'success' });
    } catch (error) {
      console.error('❌ Erreur:', error);
      onToast({ message: "❌ Erreur lors de l'ajout", type: 'error' });
    }
  };

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

      await onRefetchItems();
    } catch (error) {
      console.error('❌ Erreur:', error);
      onToast({ message: '❌ Erreur lors de la modification', type: 'error' });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await onDeleteItem(itemId);
      onToast({ message: '✅ Cadeau supprimé', type: 'success' });
    } catch (error) {
      console.error('❌ Erreur:', error);
      onToast({ message: '❌ Erreur lors de la suppression', type: 'error' });
    }
  };

  // Handler pour demander l'accès (partagée)
  const handleRequestAccessFromBanner = async () => {
    try {
      await onRequestAccess();
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  };

  // Détecter les différents cas
  const isGuestOnSharedList = !canClaim && !isOwner && wishlist.visibility === 'partagée' && user;
  const isGuestOnPublicList =
  wishlist.visibility === 'publique' &&
  !user &&
  !isOwner;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-16 relative z-10">
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">

          {/* ⬅️ Message pour liste PARTAGÉE (connecté mais pas membre) */}
          {isGuestOnSharedList && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 text-sm mb-1">
                    🔗 Liste partagée
                  </h3>
                  <p className="text-blue-800 text-sm mb-3">
                    Tu peux consulter cette liste, mais tu dois <strong>devenir membre</strong> pour réserver des cadeaux.
                  </p>
                  <button
                    onClick={handleRequestAccessFromBanner}
                    className={`inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all ${FOCUS_RING}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Demander à rejoindre
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ⬅️ NOUVEAU : Message pour liste PUBLIQUE (pas connecté) */}
          {isGuestOnPublicList && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 text-sm mb-1">
                    🌍 Liste publique
                  </h3>
                  <p className="text-green-800 text-sm mb-3">
                    Cette liste est publique ! Tu peux la consulter librement, mais tu dois <strong>te connecter</strong> pour réserver des cadeaux.
                  </p>
                  <button
                    onClick={() => navigate('/?login=true')}
                    className={`inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all ${FOCUS_RING}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Se connecter
                  </button>
                </div>
              </div>
            </div>
          )}

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
                    <FilterButtons value={statusFilter} onChange={setStatusFilter} counts={statusCounts} />
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
                  onDelete={handleDeleteItem}
                  onEdit={(item) => setEditModal({ open: true, item })}
                  onClaimChange={onRefetchItems}
                  onToast={onToast}
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
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddItem}
      />

      {/* Modal édition */}
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
            price: editModal.item.price ?? null,
            shipping_cost: editModal.item.shipping_cost ?? null,
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
