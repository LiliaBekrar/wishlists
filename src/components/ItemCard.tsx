// 📄 ItemCard.tsx
// 🧠 Rôle : Card adaptative (horizontal mobile, verticale desktop)
import { useState } from 'react';
import { FOCUS_RING } from '../utils/constants';
import type { Item } from '../hooks/useItems';

interface ItemCardProps {
  item: Item;
  isOwner: boolean;
  onDelete?: (id: string) => void;
}

export default function ItemCard({ item, isOwner }: ItemCardProps) {
  const [copiedPromo, setCopiedPromo] = useState(false);

  const handleCopyPromo = async () => {
    if (!item.promo_code) return;

    try {
      await navigator.clipboard.writeText(item.promo_code);
      setCopiedPromo(true);
      setTimeout(() => setCopiedPromo(false), 2000);
    } catch (error) {
      console.error('❌ Erreur copie:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg border border-gray-100 transition-all">

      {/* MOBILE : Layout horizontal (< md) */}
      <div className="flex md:hidden gap-3 p-3">

        {/* Image à gauche */}
        {item.image_url ? (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <span className="text-3xl">🎁</span>
          </div>
        )}

        {/* Contenu */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Titre + Prix */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">
              {item.title}
            </h4>
            {item.price && (
              <span className="text-lg font-bold text-purple-600 whitespace-nowrap">
                {item.price.toFixed(2)}€
              </span>
            )}
          </div>

          {/* Description */}
          {item.note && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-1">
              {item.note}
            </p>
          )}

          {/* Priorité */}
          <div className="mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              item.priority === 'haute' ? 'bg-red-100 text-red-700' :
              item.priority === 'moyenne' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {item.priority === 'haute' && '⭐⭐⭐ Haute'}
              {item.priority === 'moyenne' && '⭐⭐ Moyenne'}
              {item.priority === 'basse' && '⭐ Basse'}
            </span>
          </div>

          {/* Détails */}
          {(item.size || item.color || item.promo_code) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {item.size && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  📏 {item.size}
                </span>
              )}
              {item.color && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  🎨 {item.color}
                </span>
              )}
              {item.promo_code && (
                <button
                  onClick={handleCopyPromo}
                  className={`text-xs px-2 py-0.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-full font-mono transition-all ${FOCUS_RING} inline-flex items-center gap-1`}
                >
                  {copiedPromo ? '✓ Copié' : `🎟️ ${item.promo_code}`}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto">
            {item.url && (
            <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium transition-all ${FOCUS_RING} rounded px-2 py-1 hover:bg-blue-50`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {isOwner && (
              <button
                className={`inline-flex items-center gap-1 text-gray-600 hover:text-gray-700 text-xs font-medium transition-all ${FOCUS_RING} rounded px-2 py-1 hover:bg-gray-100`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP : Layout vertical (≥ md) */}
      <div className="hidden md:flex flex-col h-full">

        {/* Image en haut */}
        {item.image_url ? (
          <div className="relative w-full pt-[60%]">
            <img
              src={item.image_url}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <span className="text-5xl">🎁</span>
          </div>
        )}

        {/* Contenu */}
        <div className="p-4 flex-1 flex flex-col">

          {/* Titre */}
          <h4 className="font-bold text-gray-900 text-base mb-2 line-clamp-2">
            {item.title}
          </h4>

          {/* Description */}
          {item.note && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {item.note}
            </p>
          )}

          {/* Prix */}
          {item.price && (
            <p className="text-2xl font-bold text-purple-600 mb-3">
              {item.price.toFixed(2)} €
            </p>
          )}

          {/* Priorité */}
          <div className="mb-3">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              item.priority === 'haute' ? 'bg-red-100 text-red-700' :
              item.priority === 'moyenne' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {item.priority === 'haute' && '⭐⭐⭐ Priorité haute'}
              {item.priority === 'moyenne' && '⭐⭐ Priorité moyenne'}
              {item.priority === 'basse' && '⭐ Priorité basse'}
            </span>
          </div>

          {/* Détails */}
          {(item.size || item.color || item.promo_code) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {item.size && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                  📏 {item.size}
                </span>
              )}
              {item.color && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                  🎨 {item.color}
                </span>
              )}
              {item.promo_code && (
                <button
                  onClick={handleCopyPromo}
                  className={`text-xs px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-mono transition-all ${FOCUS_RING} inline-flex items-center gap-1.5`}
                >
                  {copiedPromo ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copié !
                    </>
                  ) : (
                    <>🎟️ {item.promo_code}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold py-2 px-4 rounded-lg transition-all ${FOCUS_RING}`}
              >
                Voir le produit
              </a>
            )}
            {isOwner && (
              <button
                className={`p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all ${FOCUS_RING}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
