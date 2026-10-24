# BookStay - Marketplace Booking Homestay

> Platform kết nối chủ homestay và khách thuê tại Hà Nội

## Tech Stack

| Layer | Tech |
|-------|------|
| Web | Next.js 14 (App Router) + TypeScript + TailwindCSS |
| Mobile | React Native (Expo) - shared logic |
| Backend | NestJS + Prisma + PostgreSQL + Redis |
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
# → http://localhost:3001/api/docs
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
│   ├── web/                    # Next.js frontend
│   │   └── src/app/            # App Router pages
│   │       ├── (auth)/         # Login, Register
│   │       ├── home/           # Home page
│   │       ├── search/         # Search listings
│   │       ├── homestay/[id]/  # Listing detail
│   │       ├── bookings/       # Booking pages
│   │       ├── profile/        # User profile
│   │       ├── host/           # Host dashboard
│   │       ├── admin/          # Admin dashboard
│   │       └── chat/           # Chat page
│   └── mobile/                 # React Native app
├── services/
│   └── api/                   # NestJS backend
│       ├── prisma/            # Database schema
│       └── src/modules/       # Feature modules
│           ├── auth/           # Authentication
│           ├── users/          # User management
│           ├── listings/       # Listings CRUD
│           ├── images/         # Image uploads
│           ├── bookings/        # Booking system
│           ├── payments/        # VNPay integration
│           ├── host/           # Host management
│           ├── chat/           # Messaging
│           ├── reviews/         # Reviews & ratings
│           ├── notifications/  # Push notifications
│           └── admin/         # Admin tools
├── packages/
│   └── shared/                # Shared types & utils
└── docker-compose.yml         # PostgreSQL + Redis
```

## API Endpoints (v1)

### Auth
- `POST /api/v1/auth/register` - Register guest/host
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Current user
- `PATCH /api/v1/auth/profile` - Update profile

### Listings
- `GET /api/v1/listings` - Search listings (filters: city, guests, price, sort)
- `GET /api/v1/listings/:id` - Get listing detail
- `GET /api/v1/listings/:id/calendar` - Get availability calendar
- `POST /api/v1/listings` - Create listing (Host only)
- `PUT /api/v1/listings/:id` - Update listing (Host only)
- `DELETE /api/v1/listings/:id` - Delete listing (Host only)

### Bookings
- `POST /api/v1/bookings` - Create booking (20-min lock)
- `GET /api/v1/bookings` - My bookings (Guest)
- `GET /api/v1/bookings/:id` - Booking detail
- `POST /api/v1/bookings/:id/cancel` - Cancel with refund calc

### Host
- `GET /api/v1/host/dashboard` - Dashboard stats
- `GET /api/v1/host/listings` - My listings
- `GET /api/v1/host/bookings` - Incoming bookings
- `POST /api/v1/host/apply` - Apply to become host

### Chat
- `GET /api/v1/chat/conversations` - List conversations
- `GET /api/v1/chat/:bookingId` - Get messages (polling)
- `POST /api/v1/chat/:bookingId` - Send message

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `GET /api/v1/admin/users` - User management
- `GET /api/v1/admin/listings` - Listing management
- `GET /api/v1/admin/bookings` - Booking management

## Database Commands

```bash
cd services/api

npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to DB
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed demo data
```

## Features

### Booking Flow
1. Guest searches & selects listing
2. Fills booking form (dates, guests)
3. Creates booking (20-min payment lock)
4. Redirected to VNPay payment
5. Payment confirmed → Booking CONFIRMED
6. Guest/Host can chat and manage booking

### Cancellation Policy
- 7+ days before check-in: 100% refund
- 3-7 days: 50% refund
- <3 days: No refund

### Commission
- Platform takes 15% from host earnings
- Monthly settlement to host bank account

## Demo Accounts (sau khi `npm run db:seed`)

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | `admin@bookstay.vn` | `Admin@123456` |
| Host | `host@bookstay.vn` | `Host@123456` |
| Guest | `guest@bookstay.vn` | `Guest@123456` |

> ⚠️ **Production**: đổi mật khẩu admin ngay lần đầu (hoặc set `ADMIN_EMAIL`/`ADMIN_PASSWORD` trước khi seed).

## Production Deployment

### Checklist trước khi launch

- [ ] **JWT_SECRET**: chuỗi ngẫu nhiên ≥ 32 ký tự (`openssl rand -hex 32`) — API từ chối khởi động nếu dùng giá trị mặc định ở production
- [ ] **.env không bao giờ commit** (đã có `.gitignore`; chỉ commit `.env.example`)
- [ ] **VNPay production**: đăng ký merchant thật tại vnpayment.vn, set `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL=https://pay.vnpayment.vn/vpcpay.html` và đăng ký `VNPAY_RETURN_URL` (URL public của API) với VNPay
- [ ] **Cloudinary**: tạo account, điền 3 biến `CLOUDINARY_*` (upload ảnh listing)
- [ ] **CORS**: set `FRONTEND_URL` đúng domain production (nhiều domain phân cách bằng phẩy)
- [ ] **Swagger**: mặc định tắt ở production, chỉ bật bằng `SWAGGER_ENABLED=true` khi cần
- [ ] **Rate limit**: mặc định 100 req/phút/IP (cấu hình qua `THROTTLER_TTL`, `THROTTLER_LIMIT`); login giới hạn 10 lần/5 phút
- [ ] Seed dữ liệu: `npm run db:seed` (chỉ tạo admin nếu chưa muốn dữ liệu demo)

### Kiến trúc khuyến nghị

```
[Vercel]  apps/web    →  NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
[Railway] services/api →  DATABASE_URL=<managed postgres>, REDIS_*, VNPAY_*, CLOUDINARY_*
[Neon/Supabase] PostgreSQL 16
```

1. **Database**: tạo PostgreSQL managed (Neon / Supabase / Railway), chạy `npx prisma migrate deploy` (hoặc `db push`) + `npm run db:seed`
2. **API**: deploy `services/api` (Node 20+), set toàn bộ env ở trên, health check `GET /api/v1/listings`
3. **Web**: deploy `apps/web` lên Vercel, set `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_SITE_URL` (dùng cho SEO/sitemap)
4. **VNPay**: cập nhật return URL được phép ở portal VNPay trỏ về `https://api.yourdomain.com/api/v1/payments/vnpay-return`

### Bảo mật đã tích hợp

| Họng bảo mật | Trạng thái |
|--------------|-----------|
| Admin API chỉ cho role ADMIN (RolesGuard) | ✅ |
| Chống overbooking: transaction SERIALIZABLE + khóa 20 phút tự hết hạn | ✅ |
| VNPay: verify chữ ký HMAC đúng chuẩn + đối chiếu số tiền, idempotent | ✅ |
| Helmet security headers | ✅ |
| Rate limiting toàn cục + chặt ở auth | ✅ |
| Validation DTO whitelist toàn cục | ✅ |

## Development Phases

| Phase | Status |
|-------|--------|
| Foundation (Auth, DB, NestJS) | ✅ Done |
| Listings & Search | ✅ Done |
| Booking + Payment (VNPay) | ✅ Done |
| Host Dashboard | ✅ Done |
| Chat + Reviews | ✅ Done |
| Admin Tools | ✅ Done |
| Web Frontend | ✅ Done |
| Production Hardening (security, build fixes, seed, docs) | ✅ Done |
| Mobile App | ⏳ Pending |

---

**Repo**: https://github.com/Cuong270206/bookstay
