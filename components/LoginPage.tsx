import React, { useState } from 'react';
import { LogIn, LoaderCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (name: string) => void;
  isLoading: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading }) => {
  const [name, setName] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isLoading) {
      onLogin(name.trim().toLowerCase());
    }
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl max-w-lg mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-text-primary">
        Bem-vindo ao Chá de Bebê da Alice 💕
      </h2>
      <p className="text-xl md:text-2xl text-text-secondary mb-8">
        Digite seu nome e sobrenome para participar:
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="sr-only">Seu nome completo</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            className="w-full px-6 py-4 text-xl border border-pastel-pink rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent outline-none transition-shadow"
            required
            aria-required="true"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-button-primary hover:bg-button-primary-hover text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-2xl flex items-center justify-center gap-3 disabled:opacity-70"
          disabled={!name.trim() || isLoading}
          aria-label={isLoading ? "Entrando..." : "Entrar"}
        >
          {isLoading ? <LoaderCircle size={28} className="animate-spin" /> : <LogIn size={28}/>}
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
