
import React, { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import GiftListPage from './components/GiftListPage';
import { Baby, Gift, LogOut } from 'lucide-react';

const USER_STORAGE_KEY = 'chadebebe_alice_user';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      setCurrentUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = useCallback((name: string) => {
    if (name.trim()) {
      localStorage.setItem(USER_STORAGE_KEY, name.trim());
      setCurrentUser(name.trim());
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pastel-lilac-light">
        <p className="text-2xl text-text-primary">Carregando... 🧸</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink-light via-white to-pastel-lilac-light text-text-primary p-4 flex flex-col items-center">
      <header className="w-full max-w-3xl text-center py-8">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center gap-3">
          <Baby size={48} className="text-pink-500" />
          Chá de Bebê da Alice
          <Gift size={48} className="text-purple-500" />
        </h1>
        {currentUser && (
          <div className="mt-4 flex justify-center items-center gap-4">
            <p className="text-xl text-text-secondary">
              Olá, <span className="font-semibold">{currentUser}</span>! 💕
            </p>
            <button
              onClick={handleLogout}
              className="bg-button-primary hover:bg-button-primary-hover text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 transition-colors duration-300 text-lg"
            >
              <LogOut size={20} /> Sair
            </button>
          </div>
        )}
      </header>
      <main className="w-full max-w-3xl">
        {!currentUser ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <GiftListPage currentUser={currentUser} />
        )}
      </main>
      <footer className="w-full max-w-3xl text-center py-6 mt-auto">
        <p className="text-text-secondary text-md">Feito com ❤️ para a Alice 🍼</p>
      </footer>
    </div>
  );
};

export default App;
