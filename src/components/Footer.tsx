// 📄 Footer.tsx
// 🧠 Rôle : Footer moderne responsive mobile-first
import { APP_NAME, APP_TAGLINE } from '../utils/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white mt-auto overflow-hidden">
      {/* Motif de fond animé - réduit sur mobile */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center">
          {/* Logo responsive */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="text-4xl sm:text-5xl animate-bounce-slow">🎁</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {APP_NAME}
              </h3>
              <p className="text-xs sm:text-sm text-purple-200">
                {APP_TAGLINE}
              </p>
            </div>
          </div>

          {/* Navigation responsive - stack sur mobile */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 mb-6 sm:mb-8 text-sm">
            <a
              href="https://github.com/LiliaBekrar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-200 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>

            <span className="hidden sm:inline text-purple-300">•</span>

            <a
              href="mailto:liliabekrar.github+support-wishlists@gmail.com"
              className="text-purple-200 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 group-hover:-rotate-6 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Support
            </a>

            <span className="hidden sm:inline text-purple-300">•</span>

            <a
              href="/privacy"
              className="text-purple-200 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 group-hover:rotate-6 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Confidentialité
            </a>
          </div>

          {/* Séparateur */}
          <div className="relative h-px mb-4 sm:mb-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-400 to-transparent animate-shimmer"></div>
          </div>

          {/* Copyright responsive */}
          <div className="text-purple-300 text-xs sm:text-sm space-y-2">
            <p className="flex flex-col sm:flex-row items-center justify-center gap-1">
              <span>© {currentYear} {APP_NAME}</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                Fait avec
                <svg
                  className="heart-svg"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  aria-hidden="true"
                >
                  <path
                    d="M12 21s-6.7-4.36-9.33-7A6.25 6.25 0 1 1 12 5.23 6.25 6.25 0 1 1 21.33 14c-2.63 2.64-9.33 7-9.33 7z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </p>
            <p className="text-xs text-purple-400">
              v7.0.0 • React + TypeScript + Supabase
            </p>
          </div>

          {/* Badge responsive */}
          <div className="mt-4 sm:mt-6 inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 backdrop-blur rounded-full border border-white/20">
          <span className="flex items-center justify-center gap-[2px] text-xs">
            <span className="text-purple-200">Powered by</span>
            <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent transition-all duration-500 hover:from-pink-400 hover:to-purple-400">
              Milk Coffee
            </span>
            <span className="font-bold leading-none">☕</span>
            <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent transition-all duration-500 hover:from-pink-400 hover:to-purple-400">
              & Passion
            </span>
          </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
