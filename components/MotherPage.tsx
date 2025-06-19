import React, { useState, useEffect, useCallback } from 'react';
import { GiftItem, User } from '../types';
import { fetchGiftItems, fetchAllUsers } from '../services/api';
import { LogOut, Users, Gift, Download, Eye, EyeOff, Plus } from 'lucide-react';
import Modal from './Modal';

interface MotherPageProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchToGiftList: () => void;
}

interface UserReservation {
  userId: string;
  userName: string;
  reservations: Array<{
    itemName: string;
    itemEmoji: string;
    quantity: number;
    suggestedQuantity: number;
  }>;
  totalItems: number;
}

const MotherPage: React.FC<MotherPageProps> = ({ currentUser, onLogout, onSwitchToGiftList }) => {
  const [items, setItems] = useState<GiftItem[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  
  // Estados para o modal de adicionar item
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newItem, setNewItem] = useState({
    name: '',
    emoji: '🎁',
    suggestedQuantity: 1
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedItems, fetchedUsers] = await Promise.all([
        fetchGiftItems(),
        fetchAllUsers()
      ]);
      setItems(fetchedItems);
      setAllUsers(fetchedUsers);
    } catch (err: any) {
      setError(`Não foi possível carregar os dados: ${err.message || 'Erro desconhecido'}. Tente novamente mais tarde. 🧸`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Funções para gerenciar o modal de adicionar item
  const handleAddItem = async () => {
    if (!newItem.name.trim() || newItem.suggestedQuantity <= 0) return;

    setIsSubmitting(true);
    try {
      // TODO: Implementar função para adicionar item no backend
      // await addGiftItem(newItem);
      
      // Por enquanto, apenas fechar o modal e recarregar
      setShowAddModal(false);
      setNewItem({ name: '', emoji: '🎁', suggestedQuantity: 1 });
      await loadData();
      
      // Feedback temporário
      alert('Presente adicionado com sucesso! 🎁');
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao adicionar presente: ${err.message || 'Tente novamente.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewItem({ name: '', emoji: '🎁', suggestedQuantity: 1 });
  };

  // Lista de emojis para escolher
  const emojiOptions = [
    '🎁', '🧸', '👶', '🍼', '👕', '👖', '👗', '👟', '🧦', '🧢', '🧤', '🛏️', 
    '🚗', '🦆', '🐻', '🐰', '🐶', '🐱', '🦁', '🐯', '🐨', '🐼', '🐸', '🐙',
    '📚', '✏️', '🎨', '🎵', '⚽', '🏀', '🎾', '🏓', '🎯', '🎪', '🎭', '🎬'
  ];

  // Processar dados para a tabela
  const userReservations = React.useMemo(() => {
    const userMap = new Map<string, UserReservation>();

    items.forEach(item => {
      item.reservations.forEach(reservation => {
        if (!userMap.has(reservation.userId)) {
          userMap.set(reservation.userId, {
            userId: reservation.userId,
            userName: reservation.personName,
            reservations: [],
            totalItems: 0
          });
        }

        const user = userMap.get(reservation.userId)!;
        user.reservations.push({
          itemName: item.name,
          itemEmoji: item.emoji,
          quantity: reservation.quantity,
          suggestedQuantity: item.suggestedQuantity
        });
        user.totalItems += reservation.quantity;
      });
    });

    return Array.from(userMap.values()).sort((a, b) => 
      a.userName.localeCompare(b.userName)
    );
  }, [items]);

  // Estatísticas gerais
  const stats = React.useMemo(() => {
    const totalUsers = allUsers.length; // Todos os usuários cadastrados
    const usersWithReservations = userReservations.length; // Usuários que fizeram reservas
    const totalReservations = userReservations.reduce((sum, user) => sum + user.reservations.length, 0);
    const totalItems = userReservations.reduce((sum, user) => sum + user.totalItems, 0);
    const totalGifts = items.length;
    const reservedGifts = items.filter(item => item.reservations.length > 0).length;

    return {
      totalUsers,
      usersWithReservations,
      totalReservations,
      totalItems,
      totalGifts,
      reservedGifts
    };
  }, [userReservations, items, allUsers]);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-2xl text-text-secondary">Carregando lista de convidados... 👶</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header da página da mãe */}
      <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-6 text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          👶 Lista de Convidados da Alice 👶
        </h1>
        <p className="text-lg text-text-secondary">
          Olá, {currentUser.name}! Aqui está o resumo de todos os convidados e seus presentes.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-text-primary">{stats.totalUsers}</p>
          <p className="text-sm text-text-secondary">Convidados</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <Gift className="w-8 h-8 text-pink-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-text-primary">{stats.totalReservations}</p>
          <p className="text-sm text-text-secondary">Reservas</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <span className="text-2xl mx-auto mb-2 block">📦</span>
          <p className="text-2xl font-bold text-text-primary">{stats.totalItems}</p>
          <p className="text-sm text-text-secondary">Itens</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <span className="text-2xl mx-auto mb-2 block">🎁</span>
          <p className="text-2xl font-bold text-text-primary">{stats.reservedGifts}</p>
          <p className="text-sm text-text-secondary">Presentes</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <span className="text-2xl mx-auto mb-2 block">📋</span>
          <p className="text-2xl font-bold text-text-primary">{stats.totalGifts}</p>
          <p className="text-sm text-text-secondary">Total</p>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-4 py-2 bg-button-primary hover:bg-button-primary-hover text-white rounded-lg transition-colors"
          >
            {showDetails ? <EyeOff size={20} /> : <Eye size={20} />}
            {showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
          </button>

          <button
            onClick={onSwitchToGiftList}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Gift size={20} />
            Ver Lista de Presentes
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            Adicionar Presente
          </button>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>

      {/* Tabela de usuários */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Convidado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Presentes</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-text-primary">Total de Itens</th>
                {showDetails && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Detalhes</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allUsers.length === 0 ? (
                <tr>
                  <td colSpan={showDetails ? 4 : 3} className="px-4 py-8 text-center text-text-secondary">
                    Nenhum convidado cadastrado ainda. 🧸
                  </td>
                </tr>
              ) : (
                allUsers.map((user, index) => {
                  const userReservation = userReservations.find(ur => ur.userId === user.docId);
                  const hasReservations = !!userReservation;
                  
                  return (
                    <tr key={user.docId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="ml-3 font-medium text-text-primary">{user.name}</span>
                          {!hasReservations && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Sem reservas
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-secondary">
                          {hasReservations 
                            ? `${userReservation!.reservations.length} presente${userReservation!.reservations.length !== 1 ? 's' : ''}`
                            : '0 presentes'
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasReservations ? (
                          <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-sm font-medium">
                            {userReservation!.totalItems} itens
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm font-medium">
                            0 itens
                          </span>
                        )}
                      </td>
                      {showDetails && (
                        <td className="px-4 py-3">
                          {hasReservations ? (
                            <div className="space-y-1">
                              {userReservation!.reservations.map((reservation, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <span className="text-lg">{reservation.itemEmoji}</span>
                                  <span className="text-text-primary">{reservation.itemName}</span>
                                  <span className="text-text-secondary">
                                    ({reservation.quantity}x de {reservation.suggestedQuantity})
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              Nenhum presente reservado
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumo final */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-text-primary mb-3 text-center">
          📊 Resumo Geral
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.usersWithReservations}</p>
            <p className="text-sm text-text-secondary">Convidados Participando</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalItems}</p>
            <p className="text-sm text-text-secondary">Itens Reservados</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {stats.totalGifts > 0 ? Math.round((stats.reservedGifts / stats.totalGifts) * 100) : 0}%
            </p>
            <p className="text-sm text-text-secondary">Presentes Cobertos</p>
          </div>
        </div>
        
        {/* Informação adicional sobre usuários sem reservas */}
        {stats.totalUsers > stats.usersWithReservations && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              <span className="font-semibold">{stats.totalUsers - stats.usersWithReservations}</span> convidado{stats.totalUsers - stats.usersWithReservations !== 1 ? 's' : ''} ainda não reservou nenhum presente.
            </p>
          </div>
        )}
      </div>

      {/* Modal para adicionar novo item */}
      {showAddModal && (
        <Modal onClose={handleCloseModal}>
          <h3 className="text-3xl font-semibold mb-6 text-text-primary text-center">
            🎁 Adicionar Novo Presente 🎁
          </h3>
          
          <div className="space-y-4">
            {/* Nome do presente */}
            <div>
              <label htmlFor="itemName" className="block text-lg text-text-secondary mb-2">
                Nome do Presente
              </label>
              <input
                id="itemName"
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Ex: Roupinhas, Brinquedos, Fraldas..."
                className="w-full px-4 py-3 text-lg border border-pastel-pink rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent outline-none transition-shadow"
              />
            </div>

            {/* Emoji */}
            <div>
              <label className="block text-lg text-text-secondary mb-2">
                Emoji do Presente
              </label>
              <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {emojiOptions.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => setNewItem({ ...newItem, emoji })}
                    className={`w-10 h-10 text-2xl rounded-lg transition-colors ${
                      newItem.emoji === emoji 
                        ? 'bg-button-primary text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantidade sugerida */}
            <div>
              <label htmlFor="suggestedQuantity" className="block text-lg text-text-secondary mb-2">
                Quantidade Sugerida
              </label>
              <input
                id="suggestedQuantity"
                type="number"
                min="1"
                value={newItem.suggestedQuantity}
                onChange={(e) => setNewItem({ ...newItem, suggestedQuantity: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 text-lg border border-pastel-pink rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              onClick={handleAddItem}
              disabled={isSubmitting || !newItem.name.trim() || newItem.suggestedQuantity <= 0}
              className="bg-button-primary hover:bg-button-primary-hover text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus size={24} />
                  Adicionar Presente
                </>
              )}
            </button>
            <button
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MotherPage; 