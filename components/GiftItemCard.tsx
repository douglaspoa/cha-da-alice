import React from 'react';
import { GiftItem, User } from '../types'; // User type imported
import { Edit3, Trash2, Gift, CheckSquare, MinusSquare, LoaderCircle } from 'lucide-react';

interface GiftItemCardProps {
  item: GiftItem;
  currentUser: User; // Changed from string to User object
  onOpenReserveModal: (item: GiftItem) => void;
  onRemoveReservation: (giftItemDocId: string) => void; // Changed from itemId to giftItemDocId
  isProcessingAction: boolean; // Renamed for clarity, indicates if an action for *this specific card* is processing
}

const GiftItemCard: React.FC<GiftItemCardProps> = ({ item, currentUser, onOpenReserveModal, onRemoveReservation, isProcessingAction }) => {
  const promisedQuantity = item.reservations.reduce((sum, r) => sum + r.quantity, 0);
  const remainingQuantity = Math.max(0, item.suggestedQuantity - promisedQuantity); // Ensure remaining is not negative
  
  // Find reservation by current user based on their unique docId
  const currentUserReservation = item.reservations.find(r => r.userId === currentUser.docId);

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col justify-between">
      <div>
        <h3 className="text-3xl font-semibold text-text-primary mb-3 flex items-center gap-2">
          {item.emoji} {item.name}
        </h3>
        <p className="text-xl text-text-secondary mb-1">
          Sugerido: <span className="font-bold">{item.suggestedQuantity}</span>
        </p>
        <p className={`text-xl mb-1 ${promisedQuantity >= item.suggestedQuantity ? 'text-green-600 font-bold' : 'text-text-secondary'}`}>
          Prometido: <span className="font-bold">{promisedQuantity}</span>
        </p>
        {promisedQuantity < item.suggestedQuantity && (
           <p className="text-xl text-blue-600 mb-3">
             Faltam: <span className="font-bold">{remainingQuantity}</span>
           </p>
        )}
         {promisedQuantity >= item.suggestedQuantity && (
           <p className="text-xl text-green-600 font-bold mb-3 flex items-center gap-2">
             <CheckSquare size={24} /> Item completo! 🎉
           </p>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-pastel-lilac">
        {isProcessingAction && (
          <div className="flex items-center justify-center text-text-secondary my-3">
            <LoaderCircle size={24} className="animate-spin mr-2" />
            Processando...
          </div>
        )}
        {!isProcessingAction && currentUserReservation ? (
          <div className="space-y-3">
            <p className="text-lg text-green-700 font-semibold text-center" role="status">
              Você vai levar: {currentUserReservation.quantity} unidade{currentUserReservation.quantity > 1 ? 's' : ''}! 💝
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onOpenReserveModal(item)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors text-lg flex items-center justify-center gap-2 disabled:opacity-60"
                aria-label={`Alterar sua reserva para ${item.name}`}
              >
                <Edit3 size={20} /> Alterar
              </button>
              <button
                onClick={() => onRemoveReservation(item.docId)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors text-lg flex items-center justify-center gap-2 disabled:opacity-60"
                aria-label={`Remover sua reserva para ${item.name}`}
              >
                <Trash2 size={20} /> Remover
              </button>
            </div>
          </div>
        ) : !isProcessingAction && (
          remainingQuantity > 0 ? (
            <button
              onClick={() => onOpenReserveModal(item)}
              className="w-full bg-button-primary hover:bg-button-primary-hover text-white font-bold py-3 px-5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-xl flex items-center justify-center gap-2 disabled:opacity-60"
              aria-label={`Quero levar ${item.name}`}
            >
              <Gift size={24} /> Quero levar!
            </button>
          ) : (
             <p className="text-center text-lg text-green-600 font-semibold py-3 px-5 rounded-lg bg-green-100 flex items-center justify-center gap-2" role="status">
                <MinusSquare size={24} /> Todas as unidades já foram prometidas!
            </p>
          )
        )}
      </div>
    </div>
  );
};

export default GiftItemCard;
