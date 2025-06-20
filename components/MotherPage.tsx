import React, { useState, useEffect, useCallback } from 'react';
import { GiftItem, User } from '../types';
import { fetchGiftItems, fetchAllUsers, addGiftItem } from '../services/api';
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
  const [newItem, setNewItem] = useState<{ name: string; emoji: string; suggestedQuantity: number }>({
    name: '',
    emoji: '🎁',
    suggestedQuantity: 1
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<{user: User, items: GiftItem[]} | null>(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState<boolean>(false);

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

  // Limpar mensagem de feedback após 3 segundos
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Funções para gerenciar o modal de adicionar item
  const handleAddItem = async () => {
    if (!newItem.name.trim() || newItem.suggestedQuantity <= 0) return;

    setIsSubmitting(true);
    try {
      await addGiftItem(newItem);
      
      // Fechar modal e limpar dados
      setShowAddModal(false);
      setNewItem({ name: '', emoji: '🎁', suggestedQuantity: 1 });
      
      // Recarregar dados
      await loadData();
      
      // Feedback de sucesso
      setFeedbackMessage({ type: 'success', text: 'Presente adicionado com sucesso! 🎁' });
    } catch (err: any) {
      console.error(err);
      setFeedbackMessage({ type: 'error', text: `Erro ao adicionar presente: ${err.message || 'Tente novamente.'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewUserDetails = (user: User) => {
    // Encontrar os itens que este usuário reservou
    const userItems = items.filter(item => 
      item.reservations.some(reservation => reservation.userId === user.docId)
    );
    
    setSelectedUserDetails({ user, items: userItems });
    setShowUserDetailsModal(true);
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel da Mãe</h1>
            <p className="text-gray-600">Bem-vinda, {currentUser.name}! 👑</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onSwitchToGiftList}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ver Lista de Presentes
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            feedbackMessage.type === 'success' 
              ? 'bg-green-100 border border-green-300 text-green-800' 
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}>
            {feedbackMessage.text}
          </div>
        )}

        {/* Dashboard Cards */}
        <div className="space-y-6">
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
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                <Plus size={20} />
                Adicionar Presente
              </button>
            </div>
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
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {hasReservations ? (
                              <div className="flex items-center gap-2">
                                <span className="text-green-600 font-medium">
                                  {userReservation!.reservations.length} presente{userReservation!.reservations.length !== 1 ? 's' : ''}
                                </span>
                                <button
                                  onClick={() => handleViewUserDetails(user)}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                                >
                                  Ver Presentes
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-500 italic">Sem reservas</span>
                            )}
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
        </div>

        {/* Modal para adicionar item */}
        {showAddModal && (
          <Modal onClose={() => setShowAddModal(false)}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Adicionar Novo Presente</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Presente
                  </label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: Roupinha, Brinquedo..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emoji
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewItem({...newItem, emoji})}
                        className={`p-2 text-xl rounded ${
                          newItem.emoji === emoji 
                            ? 'bg-purple-100 border-2 border-purple-500' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade Sugerida
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.suggestedQuantity}
                    onChange={(e) => setNewItem({...newItem, suggestedQuantity: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.name.trim() || isSubmitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal de detalhes dos presentes do usuário */}
        {showUserDetailsModal && selectedUserDetails && (
          <Modal onClose={() => setShowUserDetailsModal(false)}>
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Presentes de {selectedUserDetails.user.name}
                </h3>
                <button
                  onClick={() => setShowUserDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {selectedUserDetails.items.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">
                    {selectedUserDetails.user.name} reservou {selectedUserDetails.items.length} presente{selectedUserDetails.items.length !== 1 ? 's' : ''}:
                  </p>
                  
                  <div className="grid gap-3">
                    {selectedUserDetails.items.map((item) => {
                      const userReservation = item.reservations.find(r => r.userId === selectedUserDetails.user.docId);
                      return (
                        <div key={item.docId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.emoji}</span>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">{item.name}</h4>
                              <p className="text-sm text-gray-600">
                                Quantidade reservada: {userReservation?.quantity || 0}
                              </p>
                              {userReservation?.note && (
                                <p className="text-sm text-gray-500 mt-1">
                                  <span className="font-medium">Observação:</span> {userReservation.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎁</div>
                  <p className="text-gray-600">
                    {selectedUserDetails.user.name} ainda não reservou nenhum presente.
                  </p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowUserDetailsModal(false)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default MotherPage; 