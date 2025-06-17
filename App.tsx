
import React, { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import GiftListPage from './components/GiftListPage';
import { User } from './types';
import { getOrCreateUser } from './services/api';
import { Baby, Gift, LogOut } from 'lucide-react';
import { Timestamp } from './firebaseConfig'; // Import Timestamp

const USER_STORAGE_KEY = 'chadebebe_alice_user_v2';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUserString = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUserString) {
      try {
        const parsedStoredUser = JSON.parse(storedUserString);
        // Basic validation of stored user object and ensure createdAt is a string
        if (parsedStoredUser && parsedStoredUser.docId && parsedStoredUser.name && typeof parsedStoredUser.createdAt === 'string') {
          const userToSet: User = {
            docId: parsedStoredUser.docId,
            name: parsedStoredUser.name,
            createdAt: Timestamp.fromDate(new Date(parsedStoredUser.createdAt)), // Convert ISO string back to Timestamp
          };
          setCurrentUser(userToSet);
        } else {
          console.warn("Invalid stored user data, removing.");
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = useCallback(async (name: string) => {
    if (name.trim()) {
      setIsLoading(true);
      setError(null);
      try {
        const user = await getOrCreateUser(name.trim()); // user.createdAt is a Firestore Timestamp

        // Explicitly construct storableUser to ensure only serializable fields are included.
        // This prevents errors if 'user' object contains other non-serializable (e.g., Timestamp) fields.
        const storableUser = {
          docId: user.docId,
          name: user.name,
          createdAt: user.createdAt.toDate().toISOString(), // Convert Timestamp to ISO string for storage
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storableUser));
        
        setCurrentUser(user); // Set the state with the original user object (with Firestore Timestamp)
      } catch (err) {
        console.error("Login failed: ", err);
        setError("Não foi possível fazer login. Verifique sua conexão e tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  if (isLoading && !currentUser) {
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
              Olá, <span className="font-semibold">{currentUser.name}</span>! 💕
            </p>
            <button
              onClick={handleLogout}
              className="bg-button-primary hover:bg-button-primary-hover text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 transition-colors duration-300 text-lg"
              aria-label="Sair da conta"
            >
              <LogOut size={20} /> Sair
            </button>
          </div>
        )}
      </header>
      <main className="w-full max-w-3xl">
        {error && <p className="text-center text-red-500 p-3 bg-red-100 rounded-md mb-4">{error}</p>}
        {!currentUser ? (
          <LoginPage onLogin={handleLogin} isLoading={isLoading} />
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
