# BookStay — Marketplace Booking Homestay

> Platform kết nối chủ homestay và khách thuê tại Hà Nội

## Tech Stack

| Layer | Tech |
|-------|------|
| Web | Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui |
| Mobile | React Native (Expo) — shared logic |
| Backend | NestJS + Prisma + PostgreSQL |
| Payment | VNPay |

## Quick Start

### 1. Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL + Redis)
- npm or yarn

### 2. Clone & Install

```bash
git clone https://github.com/Cuong270206/bookstay.git
cd bookstay
npm install
```

### 3. Start Database (Docker)

```bash
docker compose up -d
```

### 4. Setup Backend API

```bash
cd services/api

# Copy env
cp .env.example .env

# Install deps
npm install

# Generate Prisma client
npm run db:generate

# Push schema to DB
npm run db:push

# Start dev server
npm run dev
# → http://localhost:3001
```

### 5. Setup Web Frontend

```bash
cd apps/web
npm install
npm run dev
# → http://localhost:3000
```

## Project Structure

```
bookstay/
├── apps/
│   ├── web/          # Next.js frontend
│   └── mobile/       # React Native app
├── services/
│   └── api/          # NestJS backend
│       ├── prisma/   # Database schema
│       └── src/modules/
├── packages/
│   └── shared/       # Shared types & utils
└── docker-compose.yml
```

## API Endpoints (v1)

### Auth
- `POST /api/v1/auth/register` — Register guest
- `POST /api/v1/auth/login` — Login
- `GET /api/v1/auth/me` — Current user

### Users
- `GET /api/v1/users/me` — Profile
- `PUT /api/v1/users/me` — Update profile

## Development

### Database Commands (services/api)

```bash
npm run db:generate   # Generate Prisma client
npm run db:push      # Push schema to DB
npm run db:migrate    # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed data
```

### API Documentation

Swagger docs: http://localhost:3001/api/docs

## Phases

1. ✅ Foundation (Auth, setup)
2. ⏳ Listings & Search
3. ⏳ Booking + Payment
4. ⏳ Host Tools
5. ⏳ Chat + Review
6. ⏳ Admin + Polish
7. ⏳ Launch

---

**Repo**: https://github.com/Cuong270206/bookstay
