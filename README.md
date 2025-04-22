# 📦 bot_binance

Bot de negociação automatizada na Binance, desenvolvido com NestJS e TypeScript. Este projeto visa facilitar operações de trading utilizando a API da Binance.

---

## 🚀 Tecnologias

- **[NestJS](https://nestjs.com/)** – Framework Node.js para aplicações escaláveis.
- **TypeScript** – Superset do JavaScript que adiciona tipagem estática.
- **Binance API** – Integração para operações de trading.
- **Yarn** – Gerenciador de pacotes.
- **ESLint & Prettier** – Ferramentas para linting e formatação de código.

---

## ⚙️ Instalação

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/nelsonlucas/bot_binance.git
   cd bot_binance
   Instale as dependências:
   ```

```bash
yarn install
```

Configure as variáveis de ambiente:

Crie um arquivo .env na raiz do projeto com as seguintes variáveis:

```bash
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret
```

Substitua your_api_key e your_api_secret pelas suas credenciais da Binance.

🧪 Scripts
Iniciar em desenvolvimento:

```bash
yarn start
```

Build para produção:

```bash
yarn build
```

Iniciar REPL (Read-Eval-Print Loop):

```bash
yarn repl
```

Executar testes:

```
bash
yarn test
```

📁 Estrutura do Projeto

```bash
bot_binance/
├── src/ # Código-fonte principal
├── test/ # Testes automatizados
├── chamada.http # Exemplos de chamadas HTTP
├── repl.ts # Script para REPL
├── .eslintrc.js # Configuração do ESLint
├── .prettierrc # Configuração do Prettier
├── package.json # Dependências e scripts
├── tsconfig.json # Configuração do TypeScript
└── yarn.lock # Lockfile do Yarn
```
