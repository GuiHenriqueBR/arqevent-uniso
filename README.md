# ArqEvent UNISO 🎓

Sistema de Gerenciamento de Eventos Acadêmicos para o curso de Arquitetura e Urbanismo da UNISO.

## Funcionalidades

### App do Aluno (PWA Mobile-First)

- 📱 Interface mobile-first otimizada
- 📅 Visualização de eventos e palestras
- ✅ Inscrição em eventos e palestras
- 📸 Leitura de QR Code para registro de presença
- 🏆 Visualização de certificados
- 👤 Perfil do aluno com estatísticas

### Painel Administrativo

- 📊 Dashboard com métricas em tempo real
- 📝 Gerenciamento de eventos e palestras
- 👥 Lista de alunos inscritos
- 🖥️ Modo projetor para exibição de QR Code
- 📜 Geração de certificados em lote

## Stack Tecnológica

- **Frontend:** React 19 + TypeScript + Vite
- **Estilização:** Tailwind CSS
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **Gráficos:** Recharts

## Setup do Projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Configure as variáveis de ambiente no `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### 3. Criar as tabelas no Supabase

Execute o SQL em `supabase/schema.sql` no SQL Editor do seu projeto Supabase.

Este script irá:

- Adicionar campos necessários na tabela `profiles`
- Criar tabelas: `eventos`, `palestras`, `inscricoes_evento`, `inscricoes_palestra`, `certificados`
- Configurar Row Level Security (RLS)
- Inserir dados de teste

### 4. Executar o projeto

```bash
npm run dev
```

O app estará disponível em `http://localhost:5173`

## Estrutura do Projeto

```
├── App.tsx                 # Componente principal com roteamento
├── components/
│   ├── StudentApp.tsx      # App do aluno (PWA)
│   ├── AdminPanel.tsx      # Painel administrativo
│   └── AuthScreen.tsx      # Tela de login/registro
├── services/
│   └── api.ts              # Serviços de API (Supabase)
├── supabaseClient.ts       # Cliente Supabase configurado
├── supabase/
│   └── schema.sql          # Schema do banco de dados
├── constants.ts            # Dados mock para desenvolvimento
└── types.ts                # Tipos TypeScript
```

## Fluxo de Presença

1. **Admin:** Cria palestra → Sistema gera QR Code único
2. **Admin:** Projeta QR Code na sala (modo projetor)
3. **Aluno:** Escaneia QR Code pelo app
4. **Sistema:** Valida:
   - Aluno inscrito na palestra
   - Horário válido (15 min tolerância)
   - QR Code correto
5. **Sistema:** Registra presença

## Certificados

Os certificados são gerados automaticamente após o evento, com:

- Código de verificação único
- Carga horária baseada nas palestras assistidas
- Possibilidade de verificação online

## Usuários de Teste

Após executar o schema.sql, você pode criar usuários através da tela de registro do app.

**Tipos de usuário:**

- `ALUNO` - Acesso ao app do estudante
- `ORGANIZADOR` - Acesso ao painel admin
- `ADMIN` - Acesso total

Para mudar o tipo de um usuário, execute no Supabase SQL:

```sql
UPDATE profiles SET tipo = 'ADMIN' WHERE email = 'seu@email.com';
```
