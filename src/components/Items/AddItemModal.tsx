/* eslint-disable @typescript-eslint/no-explicit-any */
// 📄 AddItemModal.tsx
// 🧠 Rôle : Modal pour ajouter OU modifier un cadeau avec fetch Open Graph
import { useState, useEffect } from 'react';
import { FOCUS_RING } from '../../utils/constants';
import { uploadItemImage } from '../../lib/uploadImage';
import { supabase } from '../../lib/supabaseClient';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    url: string;
    image_url: string;
    price: number;
    priority: 'basse' | 'moyenne' | 'haute';
    size: string;
    color: string;
    promo_code: string;
    shipping_cost: number | null;
  }) => Promise<void>;
  editMode?: boolean;
  initialData?: {
    name: string;
    description: string;
    url: string;
    image_url: string;
    price: number;
    priority: 'basse' | 'moyenne' | 'haute';
    size: string;
    color: string;
    promo_code: string;
    shipping_cost?: number | null;
  };
}

type FetchOGResponse = {
  title?: string;
  description?: string;
  image?: string;
  images?: string[];
  price?: number;
  color?: string;
  size?: string;
};

export default function AddItemModal({
  isOpen,
  onClose,
  onSubmit,
  editMode = false,
  initialData,
}: AddItemModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [priority, setPriority] = useState<'basse' | 'moyenne' | 'haute'>('moyenne');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [shippingFees, setShippingFees] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingOG, setFetchingOG] = useState(false);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[]>([]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setUrl('');
    setImageUrl('');
    setPrice('');
    setPriority('moyenne');
    setSize('');
    setColor('');
    setPromoCode('');
    setShippingFees('');
    setImageMode('url');
    setAvailableImages([]);
  };

  useEffect(() => {
    if (isOpen && editMode && initialData) {
      console.log('🔵 Mode édition activé avec:', initialData);
      setName(initialData.name);
      setDescription(initialData.description || '');
      setUrl(initialData.url || '');
      setImageUrl(initialData.image_url || '');
      setPrice(initialData.price.toString());
      setPriority(initialData.priority);
      setSize(initialData.size || '');
      setColor(initialData.color || '');
      setPromoCode(initialData.promo_code || '');
      setShippingFees(
        initialData.shipping_cost != null ? initialData.shipping_cost.toString() : ''
      );
      setAvailableImages([]);
    } else if (isOpen && !editMode) {
      console.log('🔵 Mode création - Reset formulaire');
      resetForm();
    }
  }, [isOpen, editMode, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!price || parseFloat(price) <= 0) {
      alert('Le prix est obligatoire et doit être supérieur à 0 €');
      return;
    }

    const trimmedShipping = shippingFees.trim();
    const shipping_cost =
      trimmedShipping === ''
        ? null
        : parseFloat(trimmedShipping.replace(',', '.'));

    setLoading(true);

    try {
      await onSubmit({
        name,
        description,
        url,
        image_url: imageUrl,
        price: parseFloat(price),
        priority,
        size,
        color,
        promo_code: promoCode,
        shipping_cost,
      });

      if (!editMode) {
        resetForm();
      }
      onClose();
    } catch (error) {
      console.error('❌ Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleFetchOG = async () => {
    if (!url.trim()) return;

    setFetchingOG(true);

    try {
      console.log('🔵 Fetch Open Graph via edge function pour:', url);

      const { data, error } = await supabase.functions.invoke<FetchOGResponse>('fetch-og', {
        body: { url },
      });

      if (error) {
        console.error('❌ Erreur edge function:', error);
        throw new Error('Erreur lors de la récupération des métadonnées');
      }

      if (!data) {
        throw new Error('Aucune donnée retournée');
      }

      if (data.title && !name) setName(data.title);
      if (data.description && !description) setDescription(data.description);

      if (Array.isArray(data.images) && data.images.length > 0) {
        setAvailableImages(data.images);
        if (!imageUrl) {
          setImageUrl(data.images[0]);
        }
      } else if (data.image && !imageUrl) {
        setImageUrl(data.image);
        setAvailableImages([data.image]);
      }

      if (typeof data.price === 'number' && !price) {
        setPrice(String(data.price));
      }
      if (data.color && !color) setColor(data.color);
      if (data.size && !size) setSize(data.size);

      console.log('✅ Open Graph récupéré via edge:', data);
    } catch (error) {
      console.error('❌ Erreur fetch OG:', error);
      alert("Impossible de récupérer les infos automatiquement. Remplis les champs manuellement.");
    } finally {
      setFetchingOG(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const publicUrl = await uploadItemImage(file, user.id);

      setImageUrl(publicUrl);
      setAvailableImages((prev) =>
        prev.includes(publicUrl) ? prev : [...prev, publicUrl]
      );

      console.log('✅ Image uploadée:', publicUrl);
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      alert(error instanceof Error ? error.message : "Erreur lors de l'upload");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl sm:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl sm:rounded-t-2xl z-10">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 id="modal-title" className="text-2xl font-bold">
            {editMode ? '✏️ Modifier le cadeau' : '🎁 Ajouter un cadeau'}
          </h2>
          <p className="text-sm opacity-90 mt-1">
            {editMode
              ? 'Modifie les informations du cadeau'
              : 'Remplis les informations du cadeau que tu souhaites'}
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* URL + Auto */}
          <div>
            <label htmlFor="item-url" className="block text-sm font-semibold text-gray-700 mb-2">
              🔗 Lien du produit
            </label>
            <div className="flex gap-2">
              <input
                id="item-url"
                type="url"
                placeholder="https://www.amazon.fr/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`flex-1 px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-purple-300`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleFetchOG}
                disabled={!url.trim() || loading || fetchingOG}
                className={`px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-all ${FOCUS_RING} whitespace-nowrap`}
                title="Récupérer les infos automatiquement"
              >
                {fetchingOG ? '⏳' : '✨ Auto'}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Colle un lien Amazon, Fnac, etc. et clique sur "✨ Auto" pour récupérer titre, description, image et prix
            </p>
          </div>

          {/* Nom */}
          <div>
            <label htmlFor="item-name" className="block text-sm font-semibold text-gray-700 mb-2">
              📝 Nom du cadeau *
            </label>
            <input
              id="item-name"
              type="text"
              placeholder="Ex: PlayStation 5, Livre de cuisine..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-purple-300`}
              required
              maxLength={200}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">{name.length}/200 caractères</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="item-description" className="block text-sm font-semibold text-gray-700 mb-2">
              💬 Description (optionnel)
            </label>
            <textarea
              id="item-description"
              placeholder="Quelques détails sur ce cadeau..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all resize-none ${FOCUS_RING} hover:border-purple-300`}
              maxLength={1000}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">{description.length}/1000 caractères</p>
          </div>

          {/* Image - URL ou Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🖼️ Image du produit (optionnel)
            </label>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  imageMode === 'url'
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-600'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                }`}
                disabled={loading}
              >
                🔗 URL
              </button>
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  imageMode === 'upload'
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-600'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                }`}
                disabled={loading}
              >
                📤 Upload
              </button>
            </div>

            {imageMode === 'url' ? (
              <input
                id="item-image-url"
                type="url"
                placeholder="https://exemple.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-purple-300`}
                disabled={loading}
              />
            ) : (
              <div>
                <div className="relative">
                  <input
                    id="item-image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={loading || uploadingImage}
                  />
                  <label
                    htmlFor="item-image-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 transition-all ${
                      uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingImage ? (
                      <div className="text-center">
                        <svg className="animate-spin h-8 w-8 mx-auto text-purple-600 mb-2" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <p className="text-sm text-gray-600">Upload en cours...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-purple-600">Clique pour uploader</span>
                          <br />
                          ou glisse une image ici
                        </p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, GIF (max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            {imageUrl && (
              <div className="mt-3">
                <div className="relative inline-block">
                  <img
                    src={imageUrl}
                    alt="Aperçu"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setAvailableImages([]);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all"
                    title="Supprimer l'image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {availableImages.length > 1 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-1">
                      Plusieurs images trouvées, choisis celle que tu préfères :
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableImages.map((img) => (
                        <button
                          key={img}
                          type="button"
                          onClick={() => setImageUrl(img)}
                          className={`border-2 rounded-lg p-0.5 transition-all ${
                            imageUrl === img ? 'border-purple-500 ring-2 ring-purple-300' : 'border-gray-200'
                          }`}
                          title="Choisir cette image"
                        >
                          <img
                            src={img}
                            alt="Choix d'image"
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prix, Frais de port, Priorité */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="item-price" className="block text-sm font-semibold text-gray-700 mb-2">
                💰 Prix * <span className="text-red-600">(obligatoire)</span>
              </label>
              <div className="relative">
                <input
                  id="item-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="49.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`w-full px-4 py-3 pr-8 text-base border-2 ${
                    !price ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl transition-all ${FOCUS_RING} hover:border-purple-300`}
                  required
                  disabled={loading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
              </div>
            </div>

            <div>
              <label htmlFor="item-shipping" className="block text-sm font-semibold text-gray-700 mb-2">
                🚚 Frais de port (optionnel)
              </label>
              <div className="relative">
                <input
                  id="item-shipping"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="4.99"
                  value={shippingFees}
                  onChange={(e) => setShippingFees(e.target.value)}
                  className={`w-full px-4 py-3 pr-8 text-base border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-purple-300`}
                  disabled={loading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Laisse vide si frais de port offerts ou inconnus.
              </p>
            </div>

            <div>
              <label htmlFor="item-priority" className="block text-sm font-semibold text-gray-700 mb-2">
                ⭐ Priorité
              </label>
              <select
                id="item-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-purple-300`}
                disabled={loading}
              >
                <option value="basse">⭐ Basse</option>
                <option value="moyenne">⭐⭐ Moyenne</option>
                <option value="haute">⭐⭐⭐ Haute</option>
              </select>
            </div>
          </div>

          {/* Taille, Couleur, Code Promo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="item-size" className="block text-sm font-semibold text-gray-700 mb-2">
                📏 Taille (optionnel)
              </label>
              <input
                id="item-size"
                type="text"
                placeholder="M, L, 42..."
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-purple-300`}
                maxLength={50}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="item-color" className="block text-sm font-semibold text-gray-700 mb-2">
                🎨 Couleur (optionnel)
              </label>
              <input
                id="item-color"
                type="text"
                placeholder="Noir, Blanc..."
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-purple-300`}
                maxLength={50}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="item-promo" className="block text-sm font-semibold text-gray-700 mb-2">
                🎟️ Code promo (optionnel)
              </label>
              <input
                id="item-promo"
                type="text"
                placeholder="PROMO20"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className={`w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl transition-all ${FOCUS_RING} hover:border-purple-300 font-mono`}
                maxLength={50}
                disabled={loading}
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all disabled:opacity-50 ${FOCUS_RING}`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !price || parseFloat(price) <= 0}
              className={`flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all ${FOCUS_RING}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {editMode ? 'Modification...' : 'Ajout...'}
                </span>
              ) : (
                <>{editMode ? '✅ Enregistrer' : '✨ Ajouter le cadeau'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
