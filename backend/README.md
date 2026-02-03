# ArqEvent UNISO - Backend API

Backend do Sistema de Gerenciamento de Eventos Universitários para o curso de Arquitetura.

## 🛠️ Tecnologias

- **Framework:** NestJS (TypeScript)
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Autenticação:** JWT (JSON Web Tokens)

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (local ou remoto)
- npm ou yarn

## 🚀 Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/arqevent_db?schema=public"
JWT_SECRET="sua-chave-secreta-aqui"
PORT=3001
```

### 3. Configurar banco de dados

**Opção A: Docker (local)**

```bash
docker-compose up -d
```

**Opção B: Supabase (remoto)**

1. Crie um projeto no [Supabase](https://supabase.com)
2. Copie a Connection String do PostgreSQL
3. Atualize `DATABASE_URL` no `.env`

### 4. Executar migrações

```bash
npx prisma migrate dev --name init
```

### 5. Popular banco com dados de teste

```bash
npx prisma db seed
```

### 6. Iniciar servidor

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 📡 Endpoints da API

### Autenticação

| Método | Endpoint         | Descrição           |
| ------ | ---------------- | ------------------- |
| POST   | `/auth/register` | Cadastro de aluno   |
| POST   | `/auth/login`    | Login (RA ou email) |
| POST   | `/auth/refresh`  | Renovar token       |
| GET    | `/auth/me`       | Perfil do usuário   |

### Eventos

| Método | Endpoint                 | Descrição          |
| ------ | ------------------------ | ------------------ |
| GET    | `/eventos`               | Listar eventos     |
| GET    | `/eventos/:id`           | Detalhes do evento |
| POST   | `/eventos`               | Criar evento       |
| PUT    | `/eventos/:id`           | Atualizar evento   |
| DELETE | `/eventos/:id`           | Excluir evento     |
| GET    | `/eventos/:id/inscritos` | Listar inscritos   |

### Palestras

| Método | Endpoint                   | Descrição            |
| ------ | -------------------------- | -------------------- |
| GET    | `/eventos/:id/palestras`   | Listar palestras     |
| GET    | `/palestras/:id`           | Detalhes da palestra |
| POST   | `/eventos/:id/palestras`   | Criar palestra       |
| GET    | `/palestras/:id/qrcode`    | Obter QR Code        |
| GET    | `/palestras/:id/inscritos` | Listar inscritos     |

### Inscrições

| Método | Endpoint                   | Descrição                |
| ------ | -------------------------- | ------------------------ |
| POST   | `/eventos/:id/inscricao`   | Inscrever-se no evento   |
| DELETE | `/eventos/:id/inscricao`   | Cancelar inscrição       |
| POST   | `/palestras/:id/inscricao` | Inscrever-se na palestra |
| DELETE | `/palestras/:id/inscricao` | Cancelar inscrição       |
| GET    | `/minhas-inscricoes`       | Minhas inscrições        |

### Presença

| Método | Endpoint                 | Descrição          |
| ------ | ------------------------ | ------------------ |
| POST   | `/presenca/validar`      | Validar QR Code    |
| GET    | `/presenca/palestra/:id` | Listar presenças   |
| PUT    | `/presenca/:id`          | Atualizar presença |

### Certificados

| Método | Endpoint                          | Descrição               |
| ------ | --------------------------------- | ----------------------- |
| GET    | `/certificados`                   | Meus certificados       |
| GET    | `/certificados/:id`               | Detalhes do certificado |
| GET    | `/certificados/verificar/:codigo` | Verificar autenticidade |
| POST   | `/certificados/gerar/:eventoId`   | Gerar certificados      |

### Relatórios

| Método | Endpoint                   | Descrição             |
| ------ | -------------------------- | --------------------- |
| GET    | `/relatorios/dashboard`    | Estatísticas gerais   |
| GET    | `/relatorios/evento/:id`   | Relatório do evento   |
| GET    | `/relatorios/aluno/:id`    | Relatório do aluno    |
| GET    | `/relatorios/palestra/:id` | Relatório da palestra |

## 🔐 Credenciais de Teste

Após executar o seed:

| Perfil      | Email                    | Senha    |
| ----------- | ------------------------ | -------- |
| Admin       | admin@uniso.br           | admin123 |
| Organizador | organizador@uniso.br     | org123   |
| Palestrante | palestrante@uniso.br     | pal123   |
| Aluno       | ana.silva@aluno.uniso.br | aluno123 |

## 📁 Estrutura do Projeto

```
backend/
├── prisma/
│   ├── schema.prisma    # Modelo do banco
│   └── seed.ts          # Dados iniciais
├── src/
│   ├── auth/            # Autenticação JWT
│   ├── eventos/         # CRUD de eventos
│   ├── palestras/       # CRUD de palestras
│   ├── inscricoes/      # Inscrições
│   ├── presenca/        # Validação QR
│   ├── certificados/    # Geração de certificados
│   ├── relatorios/      # Relatórios e estatísticas
│   ├── prisma/          # Serviço de conexão DB
│   ├── app.module.ts    # Módulo principal
│   └── main.ts          # Entry point
└── docker-compose.yml   # PostgreSQL local
```

## 📝 Licença

Projeto acadêmico - UNISO 2026
