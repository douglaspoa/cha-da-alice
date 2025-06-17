
import React, { useState, useEffect, useCallback } from 'react';
import { GiftItem, Reservation, ReservePayload, RemoveReservationPayload, User } from '../types';
import { fetchGiftItems, reserveGiftItem, removeReservation, seedGiftItems } from '../services/api';
import GiftItemCard from './GiftItemCard';
import Modal from './Modal';
import { PackageOpen, XCircle, CheckCircle2, HeartHandshake, LoaderCircle } from 'lucide-react';

interface GiftListPageProps {
  currentUser: User;
}

const GiftListPage: React.FC<GiftListPageProps> = ({ currentUser }) => {
  const [items, setItems] = useState<GiftItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<GiftItem | null>(null);
  const [reservationQuantity, setReservationQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Attempt to seed data if it's the first time (dev-friendly)
      // In a production app, seeding should be a separate administrative process.
      // This is a simplified approach.
      if (items.length === 0) { // crude check, ideally check Firestore status
          await seedGiftItems(); 
      }
      const fetchedItems = await fetchGiftItems();
      setItems(fetchedItems);
    } catch (err: any) {
      setError(`Não foi possível carregar a lista de presentes: ${err.message || 'Erro desconhecido'}. Tente novamente mais tarde. 🧸`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [items.length]); // Added items.length to re-run seed check if items somehow get cleared

  useEffect(() => {
    loadItems();
  }, [loadItems]); // loadItems itself is memoized

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleOpenModal = (item: GiftItem) => {
    setSelectedItem(item);
    const currentUserReservation = item.reservations.find(r => r.userId === currentUser.docId);
    setReservationQuantity(currentUserReservation ? currentUserReservation.quantity : 1);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setReservationQuantity(1);
    // No need to clear error here, as modal error is specific or handled by general error state
  };

  const handleReserve = async () => {
    if (!selectedItem || !currentUser.docId || reservationQuantity <= 0) return;

    setIsSubmitting(true);
    setError(null); // Clear previous page-level errors
    const payload: ReservePayload = {
      giftItemDocId: selectedItem.docId,
      userId: currentUser.docId,
      personName: currentUser.name,
      quantity: reservationQuantity,
    };

    try {
      await reserveGiftItem(payload);
      await loadItems(); // Re-fetch all items to reflect changes
      showFeedback('success', 'Presente reservado com sucesso! 💝');
      handleCloseModal();
    } catch (err: any) {
      console.error(err);
      // Keep modal open and show error within modal or as feedback
      showFeedback('error', `Ops! Algo deu errado: ${err.message || 'Tente novamente.'} 😥`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveReservation = async (giftItemDocId: string) => {
    if (!currentUser.docId) return;
    
    // Optional: add a confirmation dialog here
    // if (!confirm("Tem certeza que deseja remover seu presente?")) return;

    setIsSubmitting(true); // Indicate loading on the card or globally
    setError(null);
    const payload: RemoveReservationPayload = {
      giftItemDocId: giftItemDocId,
      userId: currentUser.docId,
    };

    try {
      await removeReservation(payload);
      await loadItems(); // Re-fetch all items
      showFeedback('success', 'Sua reserva foi removida. ✨');
    } catch (err: any) {
      console.error(err);
      showFeedback('error', `Falha ao remover: ${err.message || 'Tente novamente.'} 😥`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateMaxQuantity = (item: GiftItem) => {
    const reservedByOthers = item.reservations
        .filter(r => r.userId !== currentUser.docId)
        .reduce((sum, r) => sum + r.quantity, 0);
    return item.suggestedQuantity - reservedByOthers;
  };


  if (isLoading && items.length === 0) { // Show loading only if items are not yet loaded
    return (
      <div className="text-center py-10">
        <LoaderCircle size={48} className="mx-auto text-button-primary animate-spin mb-4" />
        <p className="text-center text-2xl text-text-secondary">Carregando lista de presentes... 🎁</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {feedbackMessage && (
        <div 
            className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white text-lg z-[100] flex items-center gap-2 ${feedbackMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
            role="alert"
            aria-live="assertive"
        >
          {feedbackMessage.type === 'success' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          {feedbackMessage.text}
        </div>
      )}
      {error && !showModal && <p role="alert" className="text-center text-xl text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>}
      
      {items.length === 0 && !isLoading && !error && (
         <div className="text-center py-10">
            <PackageOpen size={64} className="mx-auto text-pastel-pink mb-4" />
            <p className="text-2xl text-text-secondary">A lista de presentes está vazia por enquanto. 🧸</p>
            <p className="text-lg text-text-secondary mt-2">Os presentes serão adicionados em breve!</p>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {items.map(item => (
          <GiftItemCard
            key={item.docId}
            item={item}
            currentUser={currentUser}
            onOpenReserveModal={handleOpenModal}
            onRemoveReservation={handleRemoveReservation}
            isProcessingAction={isSubmitting && selectedItem?.docId === item.docId} // More specific loading state for the card being actioned
          />
        ))}
      </div>

      {showModal && selectedItem && (
        <Modal onClose={handleCloseModal}>
          <h3 className="text-3xl font-semibold mb-6 text-text-primary text-center">
            {selectedItem.emoji} Levar {selectedItem.name} {selectedItem.emoji}
          </h3>
          <p className="text-xl text-text-secondary mb-1 text-center">
            Quantidade Sugerida: <span className="font-bold">{selectedItem.suggestedQuantity}</span>
          </p>
          <p className="text-lg text-text-secondary mb-4 text-center">
            Já reservado por outros: {selectedItem.reservations.filter(r => r.userId !== currentUser.docId).reduce((sum, r) => sum + r.quantity, 0)}
          </p>

          <div className="mb-6">
            <label htmlFor="quantity" className="block text-xl text-text-secondary mb-2 text-center">
              Quantas unidades você vai levar?
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              max={calculateMaxQuantity(selectedItem)}
              value={reservationQuantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setReservationQuantity(Math.max(1, isNaN(val) ? 1 : val));
              }}
              className="w-full px-4 py-3 text-xl border border-pastel-pink rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent outline-none transition-shadow text-center"
              aria-describedby="quantity-help"
            />
             <p id="quantity-help" className="text-sm text-text-secondary mt-1 text-center">
                Você pode levar até {calculateMaxQuantity(selectedItem)} unidades deste item.
             </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleReserve}
              disabled={isSubmitting || reservationQuantity <= 0 || reservationQuantity > calculateMaxQuantity(selectedItem)}
              className="bg-button-primary hover:bg-button-primary-hover text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xl flex items-center justify-center gap-2 disabled:opacity-50"
              aria-label={isSubmitting ? 'Salvando reserva...' : 'Confirmar reserva'}
            >
              {isSubmitting ? <LoaderCircle size={24} className="animate-spin" /> : <HeartHandshake size={24} />}
              {isSubmitting ? 'Salvando...' : 'Confirmar'}
            </button>
            <button
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xl flex items-center justify-center gap-2  disabled:opacity-50"
              aria-label="Cancelar reserva"
            >
               <XCircle size={24} />
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GiftListPage;
