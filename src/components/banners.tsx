/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
// 📄 banners.tsx
// 🧠 Rôle : Bannières SVG thématiques modernes

import React from 'react';
import { BANNER_DEFAULT_HEIGHT, BANNER_OPACITY } from '../utils/constants';
import type { ThemeType as ThemeTypeBase } from '../utils/constants';

// ✅ Re-export pour que CreateListModal puisse importer depuis './banners'
export type ThemeType = ThemeTypeBase;

export type BannerProps = {
  height?: number | string;
  className?: string;
};

// ============================================================
// 🎄 BANNIÈRE NOËL
// ============================================================
export const ChristmasBanner: React.FC<BannerProps> = ({
  height = BANNER_DEFAULT_HEIGHT,
  className = ''
}) => (
  <svg
    className={`w-full ${className}`}
    height={typeof height === 'number' ? `${height}px` : height}
    viewBox="0 0 1200 300"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Bannière de Noël avec sapins et flocons"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="xmasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e4620" />
        <stop offset="50%" stopColor="#2d5016" />
        <stop offset="100%" stopColor="#1a3a52" />
      </linearGradient>

      <pattern id="snowPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="30" r="2" fill="white" opacity={BANNER_OPACITY.pattern} />
        <circle cx="60" cy="70" r="1.5" fill="white" opacity={BANNER_OPACITY.pattern + 0.1} />
        <circle cx="85" cy="20" r="1" fill="white" opacity={BANNER_OPACITY.pattern} />
      </pattern>

      <filter id="blurSnow">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
      </filter>
    </defs>

    <rect width="1200" height="300" fill="url(#xmasGrad)" />
    <rect width="1200" height="300" fill="url(#snowPattern)" />

    {/* Sapins */}
    {[
      { x: 150, scale: 0.8, opacity: BANNER_OPACITY.overlay },
      { x: 300, scale: 1, opacity: BANNER_OPACITY.decorations },
      { x: 500, scale: 1.2, opacity: 1 },
      { x: 700, scale: 1, opacity: BANNER_OPACITY.decorations },
      { x: 900, scale: 0.9, opacity: BANNER_OPACITY.overlay + 0.1 },
      { x: 1050, scale: 0.7, opacity: BANNER_OPACITY.overlay - 0.1 }
    ].map((tree, i) => (
      <g key={i} transform={`translate(${tree.x}, 250) scale(${tree.scale})`} opacity={tree.opacity}>
        <rect x="-8" y="20" width="16" height="30" fill="#4a2511" />
        <polygon points="0,-50 -35,-10 -25,-10 -40,10 -30,10 -45,30 45,30 30,10 40,10 25,-10 35,-10" fill="#2d5016" />
        <path d="M0,-60 L-2,-54 L-8,-54 L-4,-50 L-6,-44 L0,-48 L6,-44 L4,-50 L8,-54 L2,-54 Z" fill="#ffd700" />
        <circle cx="-15" cy="0" r="3" fill="#c41e3a" />
        <circle cx="12" cy="8" r="3" fill="#ffd700" />
        <circle cx="-20" cy="20" r="3" fill="#4169e1" />
      </g>
    ))}

    {/* Flocons */}
    <g opacity={BANNER_OPACITY.decorations} filter="url(#blurSnow)">
      {[
        { cx: 100, cy: 50, r: 4 },
        { cx: 250, cy: 120, r: 5 },
        { cx: 450, cy: 80, r: 3 },
        { cx: 650, cy: 150, r: 6 },
        { cx: 850, cy: 90, r: 4 },
        { cx: 1000, cy: 180, r: 5 },
        { cx: 1150, cy: 60, r: 3 }
      ].map((flake, i) => (
        <circle key={i} cx={flake.cx} cy={flake.cy} r={flake.r} fill="white" />
      ))}
    </g>

    <circle cx="1050" cy="80" r="35" fill="#f8f9fa" opacity={0.9} />
    <circle cx="1045" cy="75" r="30" fill="#e9ecef" opacity={BANNER_OPACITY.decorations} />
  </svg>
);

// ============================================================
// 🎂 BANNIÈRE ANNIVERSAIRE
// ============================================================
export const BirthdayBanner: React.FC<BannerProps> = ({
  height = BANNER_DEFAULT_HEIGHT,
  className = ''
}) => (
  <svg
    className={`w-full ${className}`}
    height={typeof height === 'number' ? `${height}px` : height}
    viewBox="0 0 1200 300"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Bannière d'anniversaire avec gâteau et confettis"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="bdayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>

      <linearGradient id="cakeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>

    <rect width="1200" height="300" fill="url(#bdayGrad)" />

    {/* Confettis */}
    <g opacity={BANNER_OPACITY.overlay + 0.1}>
      {[
        { x: 100, y: 50, w: 12, h: 20, rot: 15, fill: '#fbbf24' },
        { x: 200, y: 120, w: 10, h: 16, rot: -25, fill: '#ec4899' },
        { x: 350, y: 80, w: 14, h: 22, rot: 35, fill: '#3b82f6' },
        { x: 500, y: 40, w: 8, h: 14, rot: -15, fill: '#10b981' },
        { x: 650, y: 150, w: 12, h: 18, rot: 45, fill: '#f97316' },
        { x: 800, y: 70, w: 10, h: 16, rot: -30, fill: '#8b5cf6' },
        { x: 950, y: 180, w: 14, h: 20, rot: 20, fill: '#06b6d4' },
        { x: 1100, y: 100, w: 11, h: 17, rot: -20, fill: '#f43f5e' }
      ].map((conf, i) => (
        <rect
          key={i}
          x={conf.x}
          y={conf.y}
          width={conf.w}
          height={conf.h}
          fill={conf.fill}
          rx="2"
          transform={`rotate(${conf.rot} ${conf.x + conf.w / 2} ${conf.y + conf.h / 2})`}
        />
      ))}
    </g>

    {/* Gâteau */}
    <g transform="translate(600, 200)">
      <rect x="-100" y="0" width="200" height="60" fill="#ec4899" rx="8" />
      <rect x="-100" y="0" width="200" height="12" fill="url(#cakeGrad)" />

      {[-70, -40, -10, 20, 50, 80].map((x, i) => (
        <circle key={i} cx={x} cy="30" r="6" fill="white" opacity={BANNER_OPACITY.overlay} />
      ))}

      <rect x="-70" y="-50" width="140" height="55" fill="#a855f7" rx="8" />
      <rect x="-70" y="-50" width="140" height="10" fill="url(#cakeGrad)" />

      {[-50, -20, 10, 40].map((x, i) => (
        <circle key={i} cx={x} cy="-25" r="5" fill="white" opacity={BANNER_OPACITY.overlay} />
      ))}

      <rect x="-45" y="-90" width="90" height="45" fill="#7c3aed" rx="8" />
      <rect x="-45" y="-90" width="90" height="8" fill="url(#cakeGrad)" />

      {/* Bougies */}
      {[-25, 0, 25].map((x, i) => (
        <g key={i} transform={`translate(${x}, -105)`}>
          <rect x="-4" y="0" width="8" height="25" fill="#fbbf24" rx="2" />
          <line x1="0" y1="-2" x2="0" y2="-8" stroke="#4a2511" strokeWidth="1" />
          <ellipse cx="0" cy="-10" rx="6" ry="9" fill="#fbbf24" opacity={BANNER_OPACITY.decorations} />
          <ellipse cx="0" cy="-11" rx="4" ry="6" fill="#fde68a" opacity={0.9} />
        </g>
      ))}
    </g>

    {/* Ballons */}
    {[
      { cx: 150, cy: 100, r: 30, fill: '#ec4899' },
      { cx: 1050, cy: 80, r: 35, fill: '#3b82f6' },
      { cx: 950, cy: 130, r: 28, fill: '#10b981' }
    ].map((balloon, i) => (
      <g key={i} opacity={BANNER_OPACITY.decorations}>
        <ellipse cx={balloon.cx} cy={balloon.cy} rx={balloon.r} ry={balloon.r * 1.2} fill={balloon.fill} />
        <path
          d={`M ${balloon.cx} ${balloon.cy + balloon.r * 1.2} Q ${balloon.cx} ${balloon.cy + balloon.r * 1.5} ${balloon.cx - 5} ${balloon.cy + balloon.r * 2}`}
          stroke={balloon.fill}
          strokeWidth="2"
          fill="none"
        />
      </g>
    ))}
  </svg>
);

// ============================================================
// 👶 BANNIÈRE NAISSANCE
// ============================================================
export const BirthBanner: React.FC<BannerProps> = ({
  height = BANNER_DEFAULT_HEIGHT,
  className = ''
}) => (
  <svg
    className={`w-full ${className}`}
    height={typeof height === 'number' ? `${height}px` : height}
    viewBox="0 0 1200 300"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Bannière de naissance avec nuages et étoiles"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#7dd3fc" />
        <stop offset="50%" stopColor="#bfdbfe" />
        <stop offset="100%" stopColor="#fbcfe8" />
      </linearGradient>

      <filter id="cloudBlur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
      </filter>
    </defs>

    <rect width="1200" height="300" fill="url(#skyGrad)" />

    {/* Nuages */}
    {[
      { x: 120, y: 60, scale: 1 },
      { x: 380, y: 100, scale: 1.3 },
      { x: 650, y: 50, scale: 1.1 },
      { x: 920, y: 90, scale: 1.2 },
      { x: 250, y: 180, scale: 0.9 },
      { x: 800, y: 170, scale: 1 }
    ].map((cloud, i) => (
      <g key={i} transform={`translate(${cloud.x}, ${cloud.y}) scale(${cloud.scale})`} opacity={BANNER_OPACITY.decorations + 0.05}>
        <ellipse cx="0" cy="0" rx="45" ry="30" fill="white" />
        <ellipse cx="-30" cy="8" rx="30" ry="22" fill="white" />
        <ellipse cx="30" cy="8" rx="35" ry="25" fill="white" />
        <ellipse cx="0" cy="15" rx="40" ry="20" fill="white" />
      </g>
    ))}

    {/* Étoiles */}
    {[
      { x: 100, y: 40, size: 1.2, fill: '#fde68a' },
      { x: 300, y: 80, size: 1, fill: '#fef3c7' },
      { x: 500, y: 30, size: 1.5, fill: '#fbbf24' },
      { x: 700, y: 120, size: 1.1, fill: '#fde68a' },
      { x: 900, y: 50, size: 1.3, fill: '#fef3c7' },
      { x: 1100, y: 90, size: 1, fill: '#fbbf24' }
    ].map((star, i) => (
      <g key={i} transform={`translate(${star.x}, ${star.y}) scale(${star.size})`}>
        <path
          d="M0,-12 L-3,-4 L-12,-4 L-5,2 L-8,10 L0,5 L8,10 L5,2 L12,-4 L3,-4 Z"
          fill={star.fill}
          opacity={0.9}
        />
      </g>
    ))}

    {/* Lune */}
    <g opacity={BANNER_OPACITY.overlay}>
      <circle cx="1050" cy="100" r="50" fill="#fef3c7" />
      <circle cx="1045" cy="95" r="45" fill="#fde68a" />
    </g>

    {/* Oiseaux */}
    {[
      { x: 200, y: 150 },
      { x: 450, y: 130 },
      { x: 850, y: 160 }
    ].map((bird, i) => (
      <g key={i} opacity={BANNER_OPACITY.pattern * 4}>
        <path
          d={`M ${bird.x} ${bird.y} Q ${bird.x - 10} ${bird.y - 5} ${bird.x - 15} ${bird.y}`}
          stroke="#6b7280"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M ${bird.x} ${bird.y} Q ${bird.x + 10} ${bird.y - 5} ${bird.x + 15} ${bird.y}`}
          stroke="#6b7280"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    ))}

    {/* Arc-en-ciel */}
    <g opacity={BANNER_OPACITY.pattern * 3}>
      {[
        { r: 250, stroke: '#ef4444', offset: 0 },
        { r: 260, stroke: '#f97316', offset: 10 },
        { r: 270, stroke: '#fbbf24', offset: 20 },
        { r: 280, stroke: '#84cc16', offset: 30 },
        { r: 290, stroke: '#06b6d4', offset: 40 },
        { r: 300, stroke: '#3b82f6', offset: 50 },
        { r: 310, stroke: '#8b5cf6', offset: 60 }
      ].map((arc, i) => (
        <path
          key={i}
          d={`M 400 300 A ${arc.r} ${arc.r} 0 0 1 800 300`}
          stroke={arc.stroke}
          strokeWidth="8"
          fill="none"
        />
      ))}
    </g>
  </svg>
);

// ============================================================
// 💍 BANNIÈRE MARIAGE
// ============================================================
export const WeddingBanner: React.FC<BannerProps> = ({
  height = BANNER_DEFAULT_HEIGHT,
  className = ''
}) => (
  <svg
    className={`w-full ${className}`}
    height={typeof height === 'number' ? `${height}px` : height}
    viewBox="0 0 1200 300"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Bannière de mariage avec colombes et anneaux"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="weddingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="50%" stopColor="#fce7f3" />
        <stop offset="100%" stopColor="#e0e7ff" />
      </linearGradient>

      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>

      <filter id="petalBlur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
      </filter>
    </defs>

    <rect width="1200" height="300" fill="url(#weddingGrad)" />

    {/* Pétales */}
    <g opacity={BANNER_OPACITY.overlay} filter="url(#petalBlur)">
      {[
        { x: 80, y: 50, rot: 25, scale: 1 },
        { x: 220, y: 120, rot: -15, scale: 1.2 },
        { x: 380, y: 80, rot: 35, scale: 0.9 },
        { x: 540, y: 180, rot: -20, scale: 1.1 },
        { x: 700, y: 60, rot: 40, scale: 1 },
        { x: 860, y: 140, rot: -30, scale: 1.3 },
        { x: 1020, y: 100, rot: 15, scale: 0.8 },
        { x: 1150, y: 170, rot: -25, scale: 1 }
      ].map((petal, i) => (
        <g key={i} transform={`translate(${petal.x}, ${petal.y}) rotate(${petal.rot}) scale(${petal.scale})`}>
          <ellipse cx="0" cy="0" rx="12" ry="18" fill="#fda4af" opacity={0.7} />
        </g>
      ))}
    </g>

    {/* Anneaux */}
    <g transform="translate(600, 150)">
      <circle cx="-35" cy="0" r="50" fill="none" stroke="url(#goldGrad)" strokeWidth="12" opacity={0.9} />
      <circle cx="-35" cy="0" r="42" fill="none" stroke="#fef3c7" strokeWidth="3" />

      <circle cx="35" cy="0" r="50" fill="none" stroke="url(#goldGrad)" strokeWidth="12" opacity={0.9} />
      <circle cx="35" cy="0" r="42" fill="none" stroke="#fef3c7" strokeWidth="3" />

      <g>
        <path d="M-35,-50 L-40,-45 L-35,-40 L-30,-45 Z" fill="#60a5fa" opacity={BANNER_OPACITY.decorations} />
        <circle cx="-35" cy="-50" r="3" fill="white" opacity={0.9} />
      </g>
      <g>
        <path d="M35,-50 L30,-45 L35,-40 L40,-45 Z" fill="#60a5fa" opacity={BANNER_OPACITY.decorations} />
        <circle cx="35" cy="-50" r="3" fill="white" opacity={0.9} />
      </g>
    </g>

    {/* Colombes */}
    {[
      { x: 200, y: 80, flip: false },
      { x: 1000, y: 100, flip: true }
    ].map((dove, i) => (
      <g key={i} transform={`translate(${dove.x}, ${dove.y}) ${dove.flip ? 'scale(-1, 1)' : ''}`} opacity={BANNER_OPACITY.decorations + 0.1}>
        <ellipse cx="0" cy="0" rx="35" ry="20" fill="white" />
        <circle cx="-25" cy="-5" r="15" fill="white" />
        <path d="M-38,-5 L-43,-3 L-38,-1 Z" fill="#f59e0b" />
        <circle cx="-30" cy="-7" r="2" fill="#1f2937" />
        <ellipse cx="5" cy="-15" rx="40" ry="25" fill="white" opacity={BANNER_OPACITY.decorations} transform="rotate(-30 5 -15)" />
        <ellipse cx="10" cy="10" rx="35" ry="20" fill="white" opacity={BANNER_OPACITY.overlay + 0.1} transform="rotate(20 10 10)" />
        <path d="M30,0 Q40,5 45,0 Q40,-5 30,-3 Z" fill="white" opacity={BANNER_OPACITY.decorations} />
      </g>
    ))}

    {/* Cœurs */}
    {[
      { x: 400, y: 50, size: 0.8 },
      { x: 600, y: 30, size: 1 },
      { x: 800, y: 60, size: 0.9 }
    ].map((heart, i) => (
      <g key={i} transform={`translate(${heart.x}, ${heart.y}) scale(${heart.size})`} opacity={BANNER_OPACITY.pattern * 4}>
        <path
          d="M0,10 C0,0 -10,-5 -15,0 C-20,5 -15,15 0,25 C15,15 20,5 15,0 C10,-5 0,0 0,10 Z"
          fill="#f43f5e"
        />
      </g>
    ))}

    {/* Guirlande */}
    <g opacity={BANNER_OPACITY.decorations - 0.3}>
      {Array.from({ length: 12 }).map((_, i) => {
        const x = 100 + i * 100;
        const y = 20 + Math.sin(i * 0.8) * 15;
        return (
          <g key={i} transform={`translate(${x}, ${y})`}>
            <circle r="8" fill="#fda4af" />
            <circle cx="0" cy="0" r="4" fill="#fef3c7" />
          </g>
        );
      })}
    </g>
  </svg>
);

// ============================================================
// 🎁 BANNIÈRE AUTRE (moderne abstraite)
// ============================================================
export const ModernBanner: React.FC<BannerProps> = ({
  height = BANNER_DEFAULT_HEIGHT,
  className = ''
}) => (
  <svg
    className={`w-full ${className}`}
    height={typeof height === 'number' ? `${height}px` : height}
    viewBox="0 0 1200 300"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Bannière abstraite moderne"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="modernGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="50%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#0ea5e9" />
      </linearGradient>

      <linearGradient id="modernGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#f97316" />
      </linearGradient>

      <linearGradient id="modernGrad3" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>

      <filter id="blur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
      </filter>
    </defs>

    <rect width="1200" height="300" fill="url(#modernGrad1)" />

    <g filter="url(#blur)" opacity={BANNER_OPACITY.overlay}>
      <circle cx="200" cy="100" r="180" fill="url(#modernGrad2)" />
      <circle cx="1000" cy="250" r="200" fill="url(#modernGrad3)" />
      <circle cx="600" cy="150" r="150" fill="#ec4899" opacity={BANNER_OPACITY.pattern * 4} />
    </g>

    <g opacity={BANNER_OPACITY.pattern * 1.5}>
      <rect x="100" y="50" width="80" height="80" fill="white" opacity={BANNER_OPACITY.decorations} transform="rotate(45 140 90)" />
      <rect x="900" y="180" width="60" height="60" fill="white" opacity={BANNER_OPACITY.overlay} transform="rotate(30 930 210)" />
      <circle cx="400" cy="250" r="40" fill="white" opacity={BANNER_OPACITY.decorations - 0.3} />
      <circle cx="750" cy="80" r="30" fill="white" opacity={BANNER_OPACITY.overlay + 0.1} />
      <line x1="0" y1="300" x2="300" y2="0" stroke="white" strokeWidth="2" opacity={BANNER_OPACITY.pattern * 3} />
      <line x1="900" y1="300" x2="1200" y2="0" stroke="white" strokeWidth="2" opacity={BANNER_OPACITY.pattern * 3} />
    </g>

    <g opacity={BANNER_OPACITY.decorations}>
      <circle cx="150" cy="200" r="3" fill="white" />
      <circle cx="500" cy="50" r="2" fill="white" />
      <circle cx="850" cy="120" r="3" fill="white" />
      <circle cx="1100" cy="220" r="2" fill="white" />
    </g>
  </svg>
);

// ============================================================
// 📦 EXPORT : Mapping thème → composant + helper
// ============================================================
export const BannerMap: Record<ThemeType, React.ComponentType<BannerProps>> = {
  'noël': ChristmasBanner,
  'anniversaire': BirthdayBanner,
  'naissance': BirthBanner,
  'mariage': WeddingBanner,
  'autre': ModernBanner
};

export const getBannerByTheme = (theme: ThemeType): React.ComponentType<BannerProps> =>
  BannerMap[theme];

export default ModernBanner;
