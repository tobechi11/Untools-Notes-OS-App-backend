# AI Note Taker — Backend API

Bun + Hono REST API with Prisma ORM and PostgreSQL.

## Stack

- **Runtime:** Bun
- **Framework:** Hono
- **ORM:** Prisma 7 with `@prisma/adapter-pg`
- **Database:** PostgreSQL 16

## Prerequisites

- [Bun](https://bun.sh) >= 1.2
- Docker (for PostgreSQL) or a local PostgreSQL instance

## Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Start PostgreSQL (Docker)

```bash
docker run -d --name ainotetaker-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ainotetaker \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Configure environment

```bash
cp .env.example .env
```

Default `.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ainotetaker?schema=public
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### 4. Run migrations

```bash
bun db:migrate:dev
```

### 5. Seed sample data (optional)

```bash
bun db:seed
```

### 6. Start development server

```bash
bun run dev
```

Server runs at `http://localhost:3001/api` with hot reload.

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start dev server with hot reload |
| `bun run start` | Start production server |
| `bun db:generate` | Generate Prisma client |
| `bun db:migrate:dev` | Create & apply migrations (dev) |
| `bun db:build` | Generate client + deploy migrations |
| `bun db:seed` | Seed sample data |

## API Endpoints

Base URL: `/api`

### Memos

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/memos` | Create a new memo |
| `GET` | `/memos` | List memos (query: `q`, `tags`, `limit`, `offset`) |
| `GET` | `/memos/:id` | Get memo detail |
| `PUT` | `/memos/:id` | Save memo (title, tiptapJson, tags) |
| `DELETE` | `/memos/:id` | Delete memo |

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard/nodes` | List nodes (query: `node_types`, `tags`, `confidence`, `outcome`, `limit`, `offset`) |
| `GET` | `/dashboard/due` | List memos due for review (query: `within_days`) |

### Tags

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tags` | List all tags |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |

## Docker Compose (Full Stack)

From the project root:

```bash
docker compose up --build
```

Services:
- **db** — PostgreSQL 16 on port 5432
- **api** — Backend API on port 3001
- **web** — Next.js frontend on port 3000
