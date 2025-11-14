/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/components/Items/ItemCard.tsx
// 🧠 Rôle : Card avec DropdownMenu unifié + ClaimActionButton
// 🛠️ Auteur : Claude IA pour WishLists v7

import { useLayoutEffect, useRef, useState } from 'react';
import { FOCUS_RING } from '../../utils/constants';
import type { Item } from '../../hooks/useItems';
import ClaimActionButton from '../Items/ClaimActionButton';
import DropdownMenu, { type DropdownAction } from '../DropdownMenu';

interface ItemCardProps {
  item: Item;
  isOwner: boolean;
  canClaim?: boolean;
  wishlistId: string;
  onDelete?: (id: string) => void;
  onEdit?: (item: Item) => void;
  onClaimChange?: () => void;
  onToast?: (toast: { message: string; type: 'success' | 'error' }) => void;
}

export default function ItemCard({
  item,
  isOwner,
  canClaim = false,
  onClaimChange,
  onToast,
  wishlistId,
  onDelete,
  onEdit,
}: ItemCardProps) {
  const [copiedPromo, setCopiedPromo] = useState(false);

  // Promo mobile
  const promoBtnRef = useRef<HTMLButtonElement | null>(null);
  const promoMeasureRef = useRef<HTMLSpanElement | null>(null);
  const [shouldMarquee, setShouldMarquee] = useState(false);

  useLayoutEffect(() => {
    if (!item.promo_code) {
      setShouldMarquee(false);
      return;
    }
    const btn = promoBtnRef.current;
    const measure = promoMeasureRef.current;
    if (!btn || !measure) return;

    const recompute = () => {
      const available = Math.max(0, btn.clientWidth - 24);
      const textW = measure.scrollWidth;
      setShouldMarquee(textW > available);
    };

    requestAnimationFrame(recompute);
    const roBtn = new ResizeObserver(recompute);
    const roText = new ResizeObserver(recompute);
    roBtn.observe(btn);
    roText.observe(measure);
    window.addEventListener('load', recompute);
    return () => {
      roBtn.disconnect();
      roText.disconnect();
      window.removeEventListener('load', recompute);
    };
  }, [item.promo_code]);

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

  // 🎯 Actions du menu (utilisées par DropdownMenu)
  const menuActions: DropdownAction[] = [
    {
      label: 'Modifier',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
      onClick: () => onEdit?.(item),
    },
    {
      label: 'Supprimer',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
      onClick: () => {
        if (confirm(`Supprimer "${item.title}" ?\nCette action est irréversible.`)) {
          onDelete?.(item.id);
        }
      },
      variant: 'danger',
    },
  ];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-gray-100 transition-all">
      {/* ═════════════════════════ MOBILE (< md) ═════════════════════════ */}
      <div className="md:hidden">
        <div className="flex gap-4 p-4">
          {/* Colonne gauche : Image + Boutons */}
          <div className="flex-shrink-0 flex flex-col gap-2" style={{ width: '112px' }}>
            {item.image_url ? (
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center shadow-sm">
                <span className="text-5xl">🎁</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              {item.url && (
              <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${FOCUS_RING} shadow-sm`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Voir
                </a>
              )}

              {item.promo_code && (
                <button
                  ref={promoBtnRef}
                  onClick={handleCopyPromo}
                  className={`relative flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${FOCUS_RING} shadow-sm
                    ${copiedPromo ? 'bg-green-600 text-white' : 'bg-green-50 hover:bg-green-100 text-green-700'}
                  `}
                  title="Copier le code promo"
                  aria-live="polite"
                >
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>

                  <span
                    ref={promoMeasureRef}
                    className="absolute -left-[9999px] top-auto whitespace-nowrap font-mono"
                  >
                    {item.promo_code}
                  </span>

                  <span className="flex-1 min-w-0 overflow-hidden">
                    {(() => {
                      const showMarquee = shouldMarquee && !copiedPromo;
                      const spacer = '\u00A0\u00A0•\u00A0\u00A0';

                      if (!showMarquee) {
                        return (
                          <span className="inline-block font-mono truncate">
                            {copiedPromo ? 'Copié !' : item.promo_code}
                          </span>
                        );
                      }

                      return (
                        <span className="marquee-track marquee-duration-8s" style={{ willChange: 'transform' }}>
                          <span className="inline-block font-mono whitespace-nowrap">
                            {item.promo_code}
                            {spacer}
                          </span>
                          <span className="inline-block font-mono whitespace-nowrap">
                            {item.promo_code}
                            {spacer}
                          </span>
                        </span>
                      );
                    })()}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Colonne droite : Contenu */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 mb-2">{item.title}</h4>

              {item.price && (
                <div className="flex items-center gap-1.5 text-purple-600 mb-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-bold text-lg">{item.price.toFixed(2)} €</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                    item.priority === 'haute'
                      ? 'bg-red-50 text-red-700'
                      : item.priority === 'moyenne'
                      ? 'bg-orange-50 text-orange-700'
                      : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  {item.priority === 'haute' && '🔥 Haute'}
                  {item.priority === 'moyenne' && '⚡ Moyenne'}
                  {item.priority === 'basse' && '💡 Basse'}
                </span>
              </div>

              {item.note && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.note}</p>}

              <div className="flex flex-wrap items-center gap-1.5">
                {item.size && (
                  <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600 rounded-md">📏 {item.size}</span>
                )}
                {item.color && (
                  <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600 rounded-md">🎨 {item.color}</span>
                )}
              </div>
            </div>

            {/* Boutons actions MOBILE */}
            <div className="flex justify-end mt-2 gap-1.5 items-center">
              <div className="flex-1">
                <ClaimActionButton
                  item={item}
                  wishlistId={wishlistId}
                  isOwner={isOwner}
                  canClaim={canClaim}
                  compact={true}
                  onToast={onToast}
                  onAction={onClaimChange}
                />
              </div>

              {isOwner && (
                <DropdownMenu
                  actions={menuActions}
                  ariaLabel={`Options pour ${item.title}`}
                  className="flex-shrink-0"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════ DESKTOP (≥ md) ═════════════════════════ */}
      <div className="hidden md:flex flex-col h-full">
        {item.image_url ? (
          <div className="relative w-full pt-[60%]">
            <img src={item.image_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center">
            <span className="text-6xl">🎁</span>
          </div>
        )}

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-baseline justify-between gap-3 mb-2 min-w-0">
            <h4 className="font-bold text-gray-900 text-lg line-clamp-2 flex-1 min-w-0">{item.title}</h4>

            {item.price && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xl font-bold text-purple-600 whitespace-nowrap">
                  {item.price.toFixed(2)} €
                </span>
              </div>
            )}
          </div>

          {item.note && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.note}</p>}

          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                item.priority === 'haute'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : item.priority === 'moyenne'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}
            >
              {item.priority === 'haute' && '🔥 Priorité haute'}
              {item.priority === 'moyenne' && '⚡ Priorité moyenne'}
              {item.priority === 'basse' && '💡 Priorité basse'}
            </span>
          </div>

          {(item.size || item.color || item.promo_code) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {item.size && (
                <span className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-medium">
                  📏 {item.size}
                </span>
              )}
              {item.color && (
                <span className="text-sm px-3 py-1 bg-pink-50 text-pink-700 rounded-lg border border-pink-200 font-medium">
                  🎨 {item.color}
                </span>
              )}
              {item.promo_code && (
                <button
                  onClick={handleCopyPromo}
                  className={`text-sm px-3 py-1 ${
                    copiedPromo
                      ? 'bg-green-600 text-white'
                      : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                  } rounded-lg font-bold transition-all ${FOCUS_RING} inline-flex items-center gap-1.5`}
                >
                  {copiedPromo ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copié !
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      {item.promo_code}
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Boutons DESKTOP */}
          <div className="flex gap-2 mt-auto">
            {item.url && (
            <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold py-2.5 px-4 rounded-lg transition-all ${FOCUS_RING} shadow-md hover:shadow-lg`}
              >
                Voir le produit
              </a>
            )}

            <ClaimActionButton
              item={item}
              wishlistId={wishlistId}
              isOwner={isOwner}
              canClaim={canClaim}
              compact={false}
              onToast={onToast}
              onAction={onClaimChange}
            />

            {isOwner && (
              <DropdownMenu
                actions={menuActions}
                ariaLabel={`Options pour ${item.title}`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
