/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 src/main.tsx
// 🧠 Rôle : Point d'entrée React avec masquage automatique des logs en production
// 🛠️ Auteur : Claude IA pour WishLists v7

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ═══════════════════════════════════════════════════════════════════════════
// 🔒 SÉCURITÉ : Masquage automatique des données sensibles en production
// ═══════════════════════════════════════════════════════════════════════════
if (import.meta.env.PROD) {
  /**
   * Masque les données sensibles dans les objets
   * @param arg - Donnée à masquer
   * @returns Donnée masquée (IDs, tokens, passwords, etc.)
   */
  const maskSensitive = (arg: any): any => {
    if (!arg) return arg;

    // Si c'est un objet
    if (typeof arg === 'object' && !Array.isArray(arg)) {
      const masked: any = {};
      for (const [key, value] of Object.entries(arg)) {
        // ⬅️ Liste des champs à masquer
        if (
          key.toLowerCase().includes('id') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('api')
        ) {
          // Masquer en gardant les 4 derniers caractères
          masked[key] = typeof value === 'string' && value.length > 4
            ? `***${value.slice(-4)}`
            : '***';
        } else {
          masked[key] = maskSensitive(value); // Récursif
        }
      }
      return masked;
    }

    // Si c'est un tableau
    if (Array.isArray(arg)) {
      return arg.map(item => maskSensitive(item));
    }

    return arg;
  };

  // Sauvegarder les fonctions console originales
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  // ⬇️ Override console.log (masqué)
  console.log = (...args: any[]) => {
    const masked = args.map(arg => maskSensitive(arg));
    originalLog('[PROD]', ...masked);
  };

  // ⬇️ Override console.error (masqué mais visible)
  console.error = (...args: any[]) => {
    const masked = args.map(arg => maskSensitive(arg));
    originalError('[ERROR]', ...masked);
  };

  // ⬇️ Override console.warn (masqué mais visible)
  console.warn = (...args: any[]) => {
    const masked = args.map(arg => maskSensitive(arg));
    originalWarn('[WARN]', ...masked);
  };

  // ⬇️ Désactiver complètement debug et info
  console.debug = () => {};
  console.info = () => {};

  console.log('🔒 Mode production : logs masqués activés');
}
// ═══════════════════════════════════════════════════════════════════════════

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
