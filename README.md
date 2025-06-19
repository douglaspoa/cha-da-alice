# Chá de Bebê da Alice 🍼

Uma aplicação web para gerenciar a lista de presentes do chá de bebê da Alice, permitindo que convidados reservem presentes de forma organizada.

## ✨ Funcionalidades

- **Login personalizado**: Cada convidado pode fazer login com seu nome
- **Lista de presentes**: Visualização completa de todos os presentes disponíveis
- **Reserva de presentes**: Sistema para reservar e gerenciar presentes
- **Filtros inteligentes**:
  - Todos os presentes
  - Presentes disponíveis
  - Menos escolhidos (ordenados por popularidade)
  - Meus presentes reservados
- **Busca por nome**: Encontre presentes rapidamente
- **Gerenciamento pessoal**: Visualize, altere quantidade ou remova seus presentes
- **Interface responsiva**: Funciona perfeitamente em desktop e mobile

## 🚀 Deploy

### GitHub Pages (Recomendado)

O projeto está configurado para deploy automático no GitHub Pages. Para fazer o deploy:

1. **Configure o GitHub Pages**:
   - Vá para Settings > Pages no seu repositório
   - Em "Source", selecione "Deploy from a branch"
   - Selecione a branch `gh-pages` e pasta `/ (root)`
   - Clique em "Save"

2. **Deploy automático**:
   - O deploy acontece automaticamente quando você faz push para a branch `main`
   - O GitHub Actions irá construir e publicar o projeto

3. **Deploy manual** (se necessário):
   ```bash
   npm install
   npm run deploy
   ```

### URL do projeto
Após o deploy, o projeto estará disponível em:
`https://[seu-usuario].github.io/cha-da-alice/`

## 🛠️ Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação
```bash
git clone https://github.com/[seu-usuario]/cha-da-alice.git
cd cha-da-alice
npm install
```

### Executar localmente
```bash
npm run dev
```

### Build para produção
```bash
npm run build
```

## 📁 Estrutura do Projeto

```
cha-da-alice/
├── components/          # Componentes React
├── services/           # Serviços de API
├── .github/workflows/  # GitHub Actions
├── public/             # Arquivos estáticos
└── src/               # Código fonte
```

## 🎨 Tecnologias

- **Frontend**: React 19 + TypeScript
- **Build**: Vite
- **UI**: Tailwind CSS + Lucide React
- **Backend**: Supabase/Firebase
- **Deploy**: GitHub Pages + GitHub Actions

## 📝 Licença

Feito com ❤️ para a Alice 🍼
