import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GiftItem, Reservation, ReservePayload, RemoveReservationPayload, User } from '../types';
import { fetchGiftItems, reserveGiftItem, removeReservation } from '../services/api';
import GiftItemCard from './GiftItemCard';
import Modal from './Modal';
import { PackageOpen, XCircle, CheckCircle2, HeartHandshake, LoaderCircle, Filter, Search, Gift, Eye, EyeOff } from 'lucide-react';

interface GiftListPageProps {
  currentUser: User;
}

type FilterType = 'all' | 'available' | 'less-chosen' | 'my-reservations';

const GiftListPage: React.FC<GiftListPageProps> = ({ currentUser }) => {
  const [items, setItems] = useState<GiftItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<GiftItem | null>(null);
  const [reservationQuantity, setReservationQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Novos estados para filtros e visualização
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showMyReservations, setShowMyReservations] = useState<boolean>(false);
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedItems = await fetchGiftItems();
      setItems(fetchedItems);
    } catch (err: any) {
      setError(`Não foi possível carregar a lista de presentes: ${err.message || 'Erro desconhecido'}. Tente novamente mais tarde. 🧸`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed items.length dependency since we're not seeding anymore

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
    
    // Confirmação antes de remover
    const itemToRemove = items.find(item => item.docId === giftItemDocId);
    const itemName = itemToRemove?.name || 'este presente';
    
    if (!confirm(`Tem certeza que deseja remover "${itemName}" da sua lista?`)) return;

    setProcessingItemId(giftItemDocId);
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
      setProcessingItemId(null);
    }
  };

  const calculateMaxQuantity = (item: GiftItem) => {
    const reservedByOthers = item.reservations
        .filter(r => r.userId !== currentUser.docId)
        .reduce((sum, r) => sum + r.quantity, 0);
    return item.suggestedQuantity - reservedByOthers;
  };

  // Lógica de filtros e busca
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filtro por tipo
    switch (activeFilter) {
      case 'available':
        filtered = items.filter(item => {
          const totalReserved = item.reservations.reduce((sum, r) => sum + r.quantity, 0);
          return totalReserved < item.suggestedQuantity;
        });
        break;
      case 'less-chosen':
        filtered = items.filter(item => {
          const totalReserved = item.reservations.reduce((sum, r) => sum + r.quantity, 0);
          const percentageReserved = (totalReserved / item.suggestedQuantity) * 100;
          return percentageReserved < 50; // Itens com menos de 50% reservados
        }).sort((a, b) => {
          // Ordenar do que tem menos reservas para o que tem mais
          const aReserved = a.reservations.reduce((sum, r) => sum + r.quantity, 0);
          const bReserved = b.reservations.reduce((sum, r) => sum + r.quantity, 0);
          return aReserved - bReserved;
        });
        break;
      case 'my-reservations':
        filtered = items.filter(item => 
          item.reservations.some(r => r.userId === currentUser.docId)
        );
        break;
      default:
        filtered = items;
    }

    // Filtro por busca de texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.emoji.includes(term)
      );
    }

    return filtered;
  }, [items, activeFilter, searchTerm, currentUser.docId]);

  // Itens reservados pelo usuário atual
  const myReservations = useMemo(() => {
    return items.filter(item => 
      item.reservations.some(r => r.userId === currentUser.docId)
    ).map(item => {
      const myReservation = item.reservations.find(r => r.userId === currentUser.docId);
      return {
        ...item,
        myQuantity: myReservation?.quantity || 0
      };
    });
  }, [items, currentUser.docId]);

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
      
      {/* Seção de Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Busca por texto */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent outline-none"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'all' 
                  ? 'bg-button-primary text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveFilter('available')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'available' 
                  ? 'bg-button-primary text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Disponíveis
            </button>
            <button
              onClick={() => setActiveFilter('less-chosen')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'less-chosen' 
                  ? 'bg-button-primary text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Menos Escolhidos
            </button>
            <button
              onClick={() => setActiveFilter('my-reservations')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'my-reservations' 
                  ? 'bg-button-primary text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Meus Presentes
            </button>
            
            {/* Botão para limpar filtros */}
            {(activeFilter !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setActiveFilter('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Meus Presentes */}
      {myReservations.length > 0 && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Gift size={28} className="text-pink-500" />
              Meus Presentes ({myReservations.length})
            </h2>
            <button
              onClick={() => setShowMyReservations(!showMyReservations)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {showMyReservations ? <EyeOff size={20} /> : <Eye size={20} />}
              {showMyReservations ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          
          {/* Resumo quando oculto */}
          {!showMyReservations && myReservations.length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-text-secondary">
                Você reservou <span className="font-semibold text-pink-600">{myReservations.length} presente{myReservations.length > 1 ? 's' : ''}</span> 
                ({myReservations.reduce((total, item) => total + item.myQuantity, 0)} itens no total)
              </p>
            </div>
          )}
          
          {showMyReservations && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myReservations.map(item => (
                <div key={item.docId} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-pink-400">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-sm bg-pink-100 text-pink-800 px-2 py-1 rounded-full font-medium">
                      {item.myQuantity}x
                    </span>
                  </div>
                  <h3 className="font-semibold text-text-primary mb-1">{item.name}</h3>
                  <p className="text-sm text-text-secondary mb-3">
                    Quantidade sugerida: {item.suggestedQuantity}
                  </p>
                  
                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(item)}
                      disabled={processingItemId === item.docId}
                      className="flex-1 bg-button-primary hover:bg-button-primary-hover text-white text-sm py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingItemId === item.docId ? 'Processando...' : 'Alterar'}
                    </button>
                    <button
                      onClick={() => handleRemoveReservation(item.docId)}
                      disabled={processingItemId === item.docId}
                      className="bg-red-100 hover:bg-red-200 text-red-700 text-sm py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remover presente"
                    >
                      {processingItemId === item.docId ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <XCircle size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resultados dos filtros */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-text-primary">
            {activeFilter === 'all' && !searchTerm && 'Todos os Presentes'}
            {activeFilter === 'available' && 'Presentes Disponíveis'}
            {activeFilter === 'less-chosen' && 'Menos Escolhidos'}
            {activeFilter === 'my-reservations' && 'Meus Presentes'}
            {searchTerm && `Resultados para "${searchTerm}"`}
            {filteredItems.length > 0 && ` (${filteredItems.length})`}
          </h3>
        </div>
      </div>
      
      {items.length === 0 && !isLoading && !error && (
         <div className="text-center py-10">
            <PackageOpen size={64} className="mx-auto text-pastel-pink mb-4" />
            <p className="text-2xl text-text-secondary">A lista de presentes está vazia por enquanto. 🧸</p>
            <p className="text-lg text-text-secondary mt-2">Os presentes serão adicionados em breve!</p>
         </div>
      )}

      {/* Mensagem quando não há resultados nos filtros */}
      {items.length > 0 && filteredItems.length === 0 && !isLoading && (
        <div className="text-center py-10">
          <Search size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-2xl text-text-secondary">
            {searchTerm 
              ? `Nenhum presente encontrado para "${searchTerm}"`
              : activeFilter === 'available' 
                ? 'Todos os presentes já foram reservados! 🎉'
                : activeFilter === 'less-chosen' 
                  ? 'Todos os presentes já foram bem escolhidos! 💝'
                  : activeFilter === 'my-reservations'
                    ? 'Você ainda não reservou nenhum presente'
                    : 'Nenhum presente encontrado'
            }
          </p>
          <p className="text-lg text-text-secondary mt-2">
            {searchTerm && 'Tente buscar por outro termo ou limpe os filtros.'}
            {!searchTerm && activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className="text-button-primary hover:underline ml-1"
              >
                Ver todos os presentes
              </button>
            )}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {filteredItems.map(item => (
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
                const val = e.target.value;
                if (val === '') {
                  setReservationQuantity(1);
                } else {
                  const numVal = parseInt(val, 10);
                  if (!isNaN(numVal)) {
                    setReservationQuantity(numVal);
                  }
                }
              }}
              onBlur={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 1) {
                  setReservationQuantity(1);
                } else if (val > calculateMaxQuantity(selectedItem)) {
                  setReservationQuantity(calculateMaxQuantity(selectedItem));
                }
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
