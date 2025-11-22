// 📄 src/components/ScrollToTopButton.tsx
// 🧠 Rôle : Bouton floating pour remonter en haut de page avec indicateur de progression

import { useState, useEffect } from 'react';
import { FOCUS_RING } from '../utils/constants';

// ⚙️ Paramètres à personnaliser
const SCROLL_THRESHOLD = 200; // ⬅️ Hauteur de scroll avant apparition (px)
const CIRCLE_RADIUS = 20; // Rayon du cercle de progression
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // Circonférence du cercle

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Détecter le scroll pour afficher/masquer le bouton + calculer progression
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(Math.min(progress, 100));
      setIsVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    // Appeler une première fois pour initialiser
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fonction pour remonter en haut
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Calcul du stroke-dashoffset pour la progression circulaire
  const progressOffset = CIRCLE_CIRCUMFERENCE - (scrollProgress / 100) * CIRCLE_CIRCUMFERENCE;

  return (
    <button
      onClick={scrollToTop}
      aria-label={`Remonter en haut de la page (${Math.round(scrollProgress)}% de progression)`}
      className={`
        fixed bottom-8 right-8 z-50
        w-14 h-14 rounded-full
        bg-gradient-to-br from-purple-600 to-blue-600
        hover:from-purple-700 hover:to-blue-700
        text-white shadow-xl
        transition-all duration-300 ease-out
        hover:scale-110 active:scale-95
        ${FOCUS_RING}
        ${isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}
      style={{
        // Force le bouton à rester visible même avec overflow
        transform: isVisible ? 'translateY(0)' : 'translateY(1rem)',
      }}
    >
      {/* Cercle de progression SVG */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox="0 0 56 56"
        style={{ overflow: 'visible' }}
      >
        {/* Cercle de fond (gris transparent) */}
        <circle
          cx="28"
          cy="28"
          r={CIRCLE_RADIUS}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="3"
        />
        {/* Cercle de progression (blanc) */}
        <circle
          cx="28"
          cy="28"
          r={CIRCLE_RADIUS}
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeDasharray={CIRCLE_CIRCUMFERENCE}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          className="transition-all duration-200 ease-out"
        />
      </svg>

      {/* Icône flèche (par-dessus le cercle) */}
      <svg
        className="w-6 h-6 relative z-10 mx-auto"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
}
