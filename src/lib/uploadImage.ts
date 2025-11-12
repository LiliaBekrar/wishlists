// 📄 uploadImage.ts
// 🧠 Rôle : Utilitaire pour uploader des images vers Supabase Storage
import { supabase } from './supabaseClient';

export async function uploadItemImage(file: File, userId: string): Promise<string> {
  try {
    console.log('🔵 Upload image:', file.name, file.size, 'bytes');

    // Valider le fichier
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('L\'image est trop lourde (max 5MB)');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Format d\'image non supporté (JPG, PNG, WebP, GIF uniquement)');
    }

    // Générer un nom unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    console.log('🔵 Nom du fichier:', fileName);

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('wishlist-items')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Erreur upload Supabase:', error);
      throw error;
    }

    console.log('✅ Upload réussi:', data);

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('wishlist-items')
      .getPublicUrl(fileName);

    console.log('✅ URL publique:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('❌ Erreur upload image:', error);
    throw error;
  }
}

export async function deleteItemImage(imageUrl: string, userId: string): Promise<void> {
  try {
    // Extraire le path depuis l'URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts.slice(-2).join('/'); // userId/filename.ext

    // Vérifier que c'est bien l'image de l'utilisateur
    if (!fileName.startsWith(userId)) {
      throw new Error('Vous ne pouvez supprimer que vos propres images');
    }

    const { error } = await supabase.storage
      .from('wishlist-items')
      .remove([fileName]);

    if (error) throw error;

    console.log('✅ Image supprimée:', fileName);
  } catch (error) {
    console.error('❌ Erreur suppression image:', error);
    throw error;
  }
}
