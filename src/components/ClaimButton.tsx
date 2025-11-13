// /* eslint-disable @typescript-eslint/no-explicit-any */
// // 📄 src/components/ClaimButton.tsx
// // 🧠 Rôle : Bouton réserver avec gestion des modals selon visibilité

// import React, { useState } from 'react';
// import { supabase } from '../lib/supabaseClient';
// import { ShoppingBag, Loader2, Check } from 'lucide-react';
// import { RequestToReserveModal } from './RequestToReserveModal';
// import type { Item } from '../types/db';

// interface ClaimButtonProps {
//   item: Item;
//   wishlistId: string;
//   wishlistTitle: string;
//   wishlistVisibility: 'privée' | 'partagée' | 'publique';
//   userRole: 'owner' | 'viewer' | 'visitor';
//   onClaimed?: () => void;
// }

// export function ClaimButton({
//   item,
//   wishlistId,
//   wishlistTitle,
//   wishlistVisibility,
//   userRole,
//   onClaimed,
// }: ClaimButtonProps) {
//   const [loading, setLoading] = useState(false);
//   const [showJoinModal, setShowJoinModal] = useState(false);

//   // ⚙️ Ne pas afficher si item déjà réservé/acheté
//   if (item.status !== 'disponible') {
//     return null;
//   }

//   // ⚙️ Owner ne peut pas réserver ses propres cadeaux
//   if (userRole === 'owner') {
//     return (
//       <div className="text-sm text-gray-500 italic">
//         Vous ne pouvez pas réserver vos propres cadeaux
//       </div>
//     );
//   }

//   // ⚙️ Handler réservation
//   const handleClaim = async () => {
//     // LISTE PARTAGÉE + VISITOR → Modal "rejoindre d'abord"
//     if (wishlistVisibility === 'partagée' && userRole === 'visitor') {
//       setShowJoinModal(true);
//       return;
//     }

//     // LISTE PUBLIQUE + VISITOR → Auto viewer puis réserver
//     if (wishlistVisibility === 'publique' && userRole === 'visitor') {
//       setLoading(true);
//       try {
//         const { data: { user } } = await supabase.auth.getUser();
//         if (!user) {
//           // Rediriger vers login
//           window.location.href = '/login';
//           return;
//         }

//         // Créer membre auto (viewer)
//         await supabase.from('wishlist_members').insert({
//           wishlist_id: wishlistId,
//           user_id: user.id,
//           email: user.email,
//           role: 'viewer',
//           status: 'actif',
//         });

//         // Puis réserver
//         await reserveItem(user.id);
//       } catch (err: any) {
//         console.error('Error auto-joining:', err);
//         alert(err.message);
//       } finally {
//         setLoading(false);
//       }
//       return;
//     }

//     // VIEWER (privée invitation ou publique) → Réserver directement
//     if (userRole === 'viewer') {
//       setLoading(true);
//       try {
//         const { data: { user } } = await supabase.auth.getUser();
//         if (!user) throw new Error('Non connecté');

//         await reserveItem(user.id);
//       } catch (err: any) {
//         console.error('Error claiming:', err);
//         alert(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   // ⚙️ Fonction réservation item
//   const reserveItem = async (userId: string) => {
//     // 1. Créer claim
//     const { error: claimError } = await supabase
//       .from('claims')
//       .insert({
//         item_id: item.id,
//         user_id: userId,
//         status: 'réservé',
//       });

//     if (claimError) throw claimError;

//     // 2. Update item status
//     const { error: itemError } = await supabase
//       .from('items')
//       .update({ status: 'réservé' })
//       .eq('id', item.id);

//     if (itemError) throw itemError;

//     // 3. Envoyer notification
//     const { data: { session } } = await supabase.auth.getSession();
//     if (session) {
//       await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sendNotification`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${session.access_token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           type: 'claim',
//           wishlistId,
//           itemId: item.id,
//         }),
//       });
//     }

//     onClaimed?.();
//   };

//   return (
//     <>
//       <button
//         onClick={handleClaim}
//         disabled={loading}
//         className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
//         aria-label={`Réserver ${item.title}`}
//       >
//         {loading ? (
//           <>
//             <Loader2 className="w-4 h-4 animate-spin" />
//             <span>Réservation...</span>
//           </>
//         ) : (
//           <>
//             <ShoppingBag className="w-4 h-4" />
//             <span>Réserver</span>
//           </>
//         )}
//       </button>

//       {/* Modal "rejoindre d'abord" (liste partagée) */}
//       {showJoinModal && (
//         <RequestToReserveModal
//           wishlistId={wishlistId}
//           wishlistTitle={wishlistTitle}
//           itemTitle={item.title}
//           onClose={() => setShowJoinModal(false)}
//           onSuccess={() => {
//             // Refresh page pour recharger le rôle
//             window.location.reload();
//           }}
//         />
//       )}
//     </>
//   );
// }
