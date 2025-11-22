// // 📄 src/pages/Budget.tsx (VERSION FINALE HARMONISÉE)
// // 🧠 Rôle : Page des budgets avec design cohérent


// import { useState } from 'react';
// import { useAuth } from '../hooks/useAuth';
// import { useBudget, useBudgetDonutData } from '../hooks/useBudget';
// import { BudgetCard } from '../components/budget/BudgetCard';
// import { BudgetDonut } from '../components/budget/BudgetDonut';
// import { ExternalGiftModal } from '../components/budget/ExternalGiftModal';
// import { FOCUS_RING } from '../utils/constants';
// import type { BudgetViewMode } from '../types/db';

// export function Budget() {
//   const { user } = useAuth();
//   const { budgets, loading, error } = useBudget(user?.id || '');

//   const currentYear = new Date().getFullYear();
//   const [selectedYear, setSelectedYear] = useState(2025);
//   const [viewMode, setViewMode] = useState<BudgetViewMode>('global');
//   const [showExternalGiftModal, setShowExternalGiftModal] = useState(false);

//   const { data: donutData, loading: donutLoading } = useBudgetDonutData(
//     user?.id || '',
//     viewMode,
//     selectedYear
//   );

//   const totalSpent = budgets.find(b =>
//     b.budgetGoal.type === 'annuel' && b.budgetGoal.year === selectedYear
//   )?.spent || 0;

//   if (!user) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
//         <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center max-w-md">
//           <div className="text-6xl mb-4">🔒</div>
//           <p className="text-yellow-800 text-lg font-semibold">
//             Connectez-vous pour accéder à vos budgets
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
//           <p className="text-gray-600 font-medium">Chargement de vos budgets...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
//         <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md">
//           <p className="font-semibold text-xl mb-4 text-red-800">❌ Erreur</p>
//           <p className="text-red-700 mb-6">{error}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className={`w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all ${FOCUS_RING}`}
//           >
//             Réessayer
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
//       <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
//         {/* Header avec gradient */}
//         <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div>
//             <h1 className="text-4xl font-bold mb-2">
//               <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
//                 💰 Mes budgets
//               </span>
//             </h1>
//             <p className="text-gray-600">
//               Suivez vos dépenses cadeaux et gérez vos budgets
//             </p>
//           </div>

//           {/* ✅ Bouton style Dashboard (même que "Nouvelle liste") */}
//           <button
//             onClick={() => setShowExternalGiftModal(true)}
//             className={`
//               inline-flex items-center gap-2
//               bg-gradient-to-r from-purple-600 to-blue-600
//               hover:from-purple-700 hover:to-blue-700
//               text-white font-semibold
//               px-6 py-3
//               rounded-xl shadow-lg hover:shadow-xl
//               transition-all hover:scale-105
//               ${FOCUS_RING}
//             `}
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//             </svg>
//             <span className="hidden sm:inline">Cadeau hors-app</span>
//             <span className="sm:hidden">Nouveau</span>
//           </button>
//         </div>

//         {/* Sélecteur d'année */}
//         <div className="mb-8 flex items-center gap-4 bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-purple-200/50 w-fit">
//           <label className="text-sm font-semibold text-gray-700">📅 Année :</label>
//           <select
//             value={selectedYear}
//             onChange={(e) => setSelectedYear(parseInt(e.target.value))}
//             className={`px-4 py-2 border-2 border-purple-200 rounded-lg font-medium text-gray-900 bg-white ${FOCUS_RING} hover:border-purple-400 transition-colors`}
//           >
//             {Array.from({ length: currentYear - 2024 }, (_, i) => 2025 + i).map(year => (
//               <option key={year} value={year}>{year}</option>
//             ))}
//           </select>
//         </div>

//         {/* Budgets automatiques (cartes) */}
//         <section className="mb-12">
//           <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
//             📊 Budgets automatiques
//           </h2>

//           {budgets.length === 0 ? (
//             <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-12 text-center">
//               <div className="text-6xl mb-4">📭</div>
//               <p className="text-blue-800 text-xl font-semibold mb-2">
//                 Aucun budget pour le moment
//               </p>
//               <p className="text-blue-600">
//                 Réservez des cadeaux pour voir vos budgets apparaître automatiquement !
//               </p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {budgets.map(budgetData => (
//                 <BudgetCard
//                   key={budgetData.budgetGoal.id}
//                   budgetData={budgetData}
//                   onEditLimit={() => alert('Modal modifier limite à implémenter')}
//                 />
//               ))}
//             </div>
//           )}
//         </section>

//         {/* Donut chart */}
//         {donutLoading ? (
//           <section className="mb-12">
//             <h2 className="text-2xl font-bold text-gray-900 mb-6">
//               📈 Répartition des dépenses {selectedYear}
//             </h2>
//             <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center border border-purple-200/50">
//               <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mb-4"></div>
//               <p className="text-gray-600 font-medium">Chargement du graphique...</p>
//             </div>
//           </section>
//         ) : donutData.length > 0 ? (
//           <section className="mb-12">
//             <h2 className="text-2xl font-bold text-gray-900 mb-6">
//               📈 Répartition des dépenses {selectedYear}
//             </h2>
//             <BudgetDonut
//               data={donutData}
//               viewMode={viewMode}
//               onViewModeChange={setViewMode}
//               totalSpent={totalSpent}
//             />
//           </section>
//         ) : budgets.length > 0 ? (
//           <section className="mb-12">
//             <div className="bg-gradient-to-br from-gray-50 to-purple-50 border-2 border-gray-200 rounded-2xl p-12 text-center">
//               <div className="text-6xl mb-4">📊</div>
//               <p className="text-gray-600 text-lg">
//                 Graphique disponible dès que vous aurez des cadeaux réservés
//               </p>
//             </div>
//           </section>
//         ) : null}

//         {/* Modal cadeau hors-app */}
//         <ExternalGiftModal
//           isOpen={showExternalGiftModal}
//           onClose={() => setShowExternalGiftModal(false)}
//           userId={user?.id || ''}
//           onSuccess={() => {
//             setShowExternalGiftModal(false);
//             window.location.reload();
//           }}
//         />
//       </div>
//     </div>
//   );
// }
