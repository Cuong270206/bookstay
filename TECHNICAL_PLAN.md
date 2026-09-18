# TECHNICAL PLAN — BookStay v1.0

**Based on**: UX Spec v1.0
**Generated**: 2025-01-09
**Status**: For Review

---

## 1. TECH STACK RECOMMENDATION

### 1.1 Web (Guest-facing + Host Dashboard + Admin)

```
┌─────────────────────────────────────────────────┐
│  FRONTEND                                        │
│  Framework:    Next.js 14 (App Router)          │
│  Language:     TypeScript                        │
│  Styling:      TailwindCSS + shadcn/ui          │
│  State:        Zustand (global) + React Query   │
│  Forms:        React Hook Form + Zod            │
│  i18n:         next-intl (tiếng Việt)          │
│  Auth:         NextAuth.js (JWT)                 │
└─────────────────────────────────────────────────┘
                        ↓ API
┌─────────────────────────────────────────────────┐
│  BACKEND (Monolith — v1)                        │
│  Runtime:      Node.js 20 LTS                   │
│  Framework:    NestJS (modular architecture)    │
│  ORM:          Prisma (PostgreSQL)              │
│  Validation:   class-validator + Zod            │
│  Auth:         JWT + Refresh Token              │
│  Queue:        Bull (Redis) — email, notif     │
│  File:        Multer + Cloudinary SDK          │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│  DATABASE & SERVICES                             │
│  DB:           PostgreSQL 15 (Supabase/self-host)│
│  Cache:        Redis (session, lock, cache)     │
│  Storage:      Cloudinary (images)             │
│  Maps:         Google Maps JavaScript API       │
│  Payment:      VNPay API (sandbox → prod)       │
│  Push:         Firebase Cloud Messaging (v2)    │
└─────────────────────────────────────────────────┘
```

### 1.2 Mobile (React Native — shared logic with web)

```
┌─────────────────────────────────────────────────┐
│  MOBILE APP                                     │
│  Framework:    React Native (Expo)             │
│  Language:     TypeScript                       │
│  Navigation:   React Navigation v6             │
│  State:        Zustand + React Query           │
│  Forms:        React Hook Form                 │
│  Push:         Expo Notifications               │
└─────────────────────────────────────────────────┘
```

### 1.3 Stack Justification

| Layer | Choice | Reason |
|-------|--------|--------|
| Web Framework | Next.js 14 | SSR/SSG cho SEO, App Router, TypeScript first |
| Mobile | React Native | Shared logic với web, 1 team maintain |
| Backend | NestJS | Modular, DI, TypeScript, scalable |
| ORM | Prisma | Type-safe, migrations, GUI (Prisma Studio) |
| Database | PostgreSQL | Relational consistency, JSON support |
| State | Zustand + React Query | Simple, performant, React Query cho server state |
| Payment | VNPay | Requirement — phổ biến nhất VN |
| Images | Cloudinary | CDN, transformation, đơn giản integration |

---

## 2. FOLDER STRUCTURE

```
bookstay/
├── apps/
│   ├── web/                    # Next.js 14 (Guest + Host + Admin)
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   │   ├── (auth)/     # Auth group: /login, /register
│   │   │   │   ├── (guest)/    # Guest pages: /, /homestay/:id, /bookings
│   │   │   │   ├── (host)/     # Host pages: /host/dashboard, /host/listings
│   │   │   │   ├── (admin)/    # Admin pages: /admin/dashboard
│   │   │   │   └── api/        # API routes (BFF pattern)
│   │   │   ├── components/     # Shared + feature components
│   │   │   │   ├── ui/         # shadcn/ui base components
│   │   │   │   ├── booking/    # Booking-related components
│   │   │   │   ├── listing/    # Listing components
│   │   │   │   └── ...
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Utilities, API client, constants
│   │   │   ├── stores/         # Zustand stores
│   │   │   └── types/         # Shared TypeScript types
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── mobile/                 # React Native (Expo)
│       ├── src/
│       │   ├── screens/        # Screen components
│       │   ├── components/     # Reusable components
│       │   ├── navigation/     # React Navigation setup
│       │   ├── services/       # API calls
│       │   ├── stores/         # Zustand stores
│       │   ├── hooks/          # Custom hooks
│       │   ├── types/          # TypeScript types
│       │   └── utils/         # Utilities
│       ├── app.json
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared code (types, utils)
│       ├── types/             # TypeScript interfaces
│       ├── constants/         # App constants
│       └── utils/             # Shared utilities
│
├── services/
│   └── api/                   # NestJS Backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/      # Login, Register, JWT
│       │   │   ├── users/     # User CRUD
│       │   │   ├── host/      # Host application, profile
│       │   │   ├── listings/  # Homestay CRUD
│       │   │   ├── bookings/  # Booking flow
│       │   │   ├── payments/  # VNPay integration
│       │   │   ├── calendar/  # Calendar blocks
│       │   │   ├── chat/      # Chat (polling)
│       │   │   ├── reviews/   # Review & rating
│       │   │   ├── admin/     # Admin actions
│       │   │   └── notifications/ # Email, push
│       │   ├── common/        # Guards, decorators, filters
│       │   ├── prisma/        # Prisma client + schema
│       │   └── utils/        # Helpers
│       ├── prisma/
│       │   └── schema.prisma  # Database schema
│       └── package.json
│
├── docker-compose.yml         # PostgreSQL + Redis
├── turbo.json                # Turborepo config
└── package.json              # Root package.json
```

---

## 3. DATABASE SCHEMA (Prisma)

```prisma
// services/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  GUEST
  HOST
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum HostStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}

enum ListingStatus {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  NEEDS_EDIT
  REJECTED
  PAUSED
  DELETED
}

enum BookingStatus {
  PENDING_PAYMENT
  CONFIRMED
  CANCELLED
  CANCELLED_50
  CANCELLED_0
  COMPLETED
  REFUND_PROCESSING
  REFUNDED
  REFUND_FAILED
}

enum PaymentStatus {
  CREATED
  PENDING
  SUCCESS
  FAILED
  TIMEOUT
  REFUNDED
}

enum SettlementStatus {
  PENDING
  PROCESSING
  SETTLED
  FAILED
}

model User {
  id            String      @id @default(uuid())
  email         String      @unique
  phone         String?     @unique
  passwordHash  String
  name          String
  role          Role       @default(GUEST)
  status        UserStatus @default(ACTIVE)
  avatar        String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  // Host info
  hostStatus    HostStatus?
  hostProfile   HostProfile?

  // Relations
  bookings      Booking[]   @relation("GuestBookings")
  reviews       Review[]
  chatMessages  ChatMessage[]
  hostBookings  Booking[]   @relation("HostBookings") // For host user

  @@map("users")
}

model HostProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])

  // Business info
  businessName    String?
  businessLicense String?  // URL to license image

  // Bank account (required for settlement)
  bankName        String?
  bankAccountName String?
  bankAccountNumber String?

  // Stats
  listingCount    Int      @default(0)
  totalEarnings   Decimal  @default(0) @db.Decimal(12, 2)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  listings        Listing[]

  @@map("host_profiles")
}

model Listing {
  id            String         @id @default(uuid())
  hostId        String
  host          HostProfile    @relation(fields: [hostId], references: [id])

  // Basic info
  title         String
  description   String
  address       String
  latitude      Float?
  longitude     Float?
  city          String         @default("Hà Nội")

  // Property details
  maxGuests     Int            @default(4)
  bedrooms      Int            @default(1)
  bathrooms     Int            @default(1)
  area          Float?         // m2

  // Pricing (VND)
  basePrice     Decimal        @db.Decimal(10, 2)
  weekendPrice  Decimal?       @db.Decimal(10, 2) // Weekend surcharge
  cleaningFee   Decimal?       @db.Decimal(10, 2)

  // Amenities (JSON array)
  amenities     String[]       // ["wifi", "parking", "pool", "kitchen", "ac"]

  // Images
  images        ListingImage[]

  // Status
  status        ListingStatus  @default(DRAFT)

  // Admin review
  reviewNote    String?
  reviewedAt    DateTime?
  reviewedBy    String?

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  bookings      Booking[]
  calendarBlocks CalendarBlock[]

  @@index([status, city])
  @@index([hostId])
  @@map("listings")
}

model ListingImage {
  id          String   @id @default(uuid())
  listingId   String
  listing     Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  url         String
  cloudinaryId String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())

  @@map("listing_images")
}

model Booking {
  id            String        @id @default(uuid())

  // Relations
  listingId     String
  listing       Listing       @relation(fields: [listingId], references: [id])
  guestId       String
  guest         User          @relation("GuestBookings", fields: [guestId], references: [id])

  // Dates
  checkIn       DateTime     @db.Date
  checkOut      DateTime     @db.Date
  nights        Int

  // Guest info (snapshot at booking time)
  guestName     String
  guestPhone    String
  guestEmail    String
  guestCount    Int
  specialRequests String?

  // Pricing (VND) — snapshot
  nightlyRate   Decimal      @db.Decimal(10, 2)
  cleaningFee   Decimal?     @db.Decimal(10, 2)
  subtotal      Decimal      @db.Decimal(10, 2)
  platformFee   Decimal      @db.Decimal(10, 2) // 15%
  totalAmount   Decimal      @db.Decimal(10, 2)
  refundAmount  Decimal?     @db.Decimal(10, 2)

  // Status
  status        BookingStatus @default(PENDING_PAYMENT)

  // Payment
  payment       Payment?
  settlement    Settlement?

  // Refund
  cancelReason  String?
  cancelledAt   DateTime?
  refundReason  String?

  // Chat
  chatMessages  ChatMessage[]

  // Review
  review        Review?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Optimistic lock
  version       Int           @default(1)

  @@index([listingId, checkIn, checkOut])
  @@index([guestId])
  @@index([status])
  @@map("bookings")
}

model Payment {
  id              String        @id @default(uuid())
  bookingId       String        @unique
  booking         Booking       @relation(fields: [bookingId], references: [id])

  // VNPay fields
  vnpTransactionId String?
  vnpOrderInfo     String?
  vnpAmount        Int           // Amount in VND (no decimals)
  vnpResponseCode  String?
  vnpBankCode      String?
  vnpPayDate       DateTime?

  // Status
  status          PaymentStatus @default(CREATED)
  returnUrl       String?

  // Lock
  lockExpiresAt   DateTime?     // 20 min lock from booking

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  refunds         Refund[]

  @@map("payments")
}

model Refund {
  id            String        @id @default(uuid())
  paymentId     String
  payment       Payment       @relation(fields: [paymentId], references: [id])

  amount        Decimal       @db.Decimal(10, 2)
  reason        String
  status        String        @default("PENDING") // PENDING, PROCESSING, COMPLETED, FAILED

  adminId       String?
  processedAt   DateTime?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@map("refunds")
}

model Settlement {
  id            String          @id @default(uuid())
  bookingId     String          @unique
  booking       Booking         @relation(fields: [bookingId], references: [id])

  grossAmount   Decimal         @db.Decimal(10, 2)
  commission    Decimal         @db.Decimal(10, 2) // 15%
  netAmount     Decimal         @db.Decimal(10, 2)

  status        SettlementStatus @default(PENDING)

  vnpTxnId      String?
  settledAt      DateTime?

  createdAt     DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@map("settlements")
}

model CalendarBlock {
  id          String   @id @default(uuid())
  listingId   String
  listing     Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  startDate   DateTime @db.Date
  endDate     DateTime @db.Date
  reason      String   // "OWNER_BLOCKED", "MAINTENANCE", "OTHER"
  note        String?

  // Optimistic lock
  version     Int      @default(1)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([listingId, startDate, endDate])
  @@map("calendar_blocks")
}

model ChatMessage {
  id          String   @id @default(uuid())
  bookingId   String
  booking     Booking  @relation(fields: [bookingId], references: [id])

  senderId    String
  sender      User     @relation(fields: [senderId], references: [id])

  message     String   @db.Text
  readAt      DateTime?

  createdAt   DateTime @default(now())

  @@index([bookingId, createdAt])
  @@map("chat_messages")
}

model Review {
  id          String   @id @default(uuid())
  bookingId   String   @unique
  booking     Booking  @relation(fields: [bookingId], references: [id])

  reviewerId  String
  reviewer    User     @relation(fields: [reviewerId], references: [id])

  rating      Int      // 1-5 stars
  comment     String?  @db.Text

  // Edit tracking
  editedAt    DateTime?
  deletedAt   DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Admin moderation
  flagged     Boolean  @default(false)
  flagReason  String?

  @@map("reviews")
}

model Notification {
  id          String   @id @default(uuid())
  userId      String

  type        String   // "BOOKING_CONFIRMED", "PAYMENT_SUCCESS", etc.
  title       String
  body        String
  data        Json?    // Additional payload

  readAt      DateTime?

  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@map("notifications")
}
```

---

## 4. API DESIGN

### 4.1 API Structure

```
Base URL: /api/v1

Authentication: Bearer JWT
Content-Type: application/json
```

### 4.2 Core Endpoints

#### Auth
```
POST   /auth/register           # Register guest
POST   /auth/login              # Login → returns JWT
POST   /auth/refresh            # Refresh token
POST   /auth/logout             # Invalidate refresh token
POST   /auth/forgot-password    # Send reset email
POST   /auth/reset-password     # Reset with token
```

#### Users
```
GET    /users/me                # Current user profile
PUT    /users/me                # Update profile
POST   /users/me/avatar         # Upload avatar
```

#### Listings (Public)
```
GET    /listings               # Search listings (with filters)
  ?city=Hà+Nội
  &checkIn=2025-01-15
  &checkOut=2025-01-17
  &guests=2
  &minPrice=500000
  &maxPrice=2000000
  &amenities=wifi,pool
  &sortBy=price_asc|rating|newest
  &page=1&limit=20

GET    /listings/:id            # Listing detail
GET    /listings/:id/calendar   # Availability calendar
GET    /listings/:id/reviews    # Listing reviews
```

#### Bookings (Guest)
```
POST   /bookings                # Create booking (with lock)
  Body: { listingId, checkIn, checkOut, guestCount, guestName, guestPhone, guestEmail, specialRequests }
  Response: { bookingId, lockExpiresAt, paymentUrl }

GET    /bookings                # My bookings (with filters)
GET    /bookings/:id            # Booking detail
POST   /bookings/:id/cancel     # Cancel booking
GET    /bookings/:id/chat       # Chat messages
POST   /bookings/:id/chat       # Send message (polling-based)
POST   /bookings/:id/review     # Submit review
PUT    /bookings/:id/review     # Edit review (within 48h)
DELETE /bookings/:id/review     # Delete review
```

#### Payments
```
POST   /payments/:bookingId/vnpay-return    # VNPay callback (GET)
POST   /payments/:bookingId/create           # Create payment URL
GET    /payments/:bookingId/status           # Check payment status (polling)
```

#### Host
```
POST   /host/apply              # Submit host application
GET    /host/profile            # Host profile
PUT    /host/profile            # Update (bank account required)

GET    /host/listings           # My listings
POST   /host/listings           # Create listing (draft)
PUT    /host/listings/:id       # Update listing
DELETE /host/listings/:id       # Soft delete listing (check for active bookings)
POST   /host/listings/:id/submit # Submit for review

GET    /host/calendar/:listingId           # Calendar blocks
POST   /host/calendar/:listingId/blocks    # Add block
PUT    /host/calendar/blocks/:blockId      # Update block
DELETE /host/calendar/blocks/:blockId      # Delete block

GET    /host/bookings           # Incoming bookings
PUT    /host/bookings/:id/confirm          # (Auto in v1 — no action needed)
PUT    /host/bookings/:id/decline          # Only if PENDING_PAYMENT

GET    /host/earnings           # Earnings & settlement history
GET    /host/stats              # Dashboard stats
```

#### Admin
```
GET    /admin/dashboard         # Overview stats
GET    /admin/listings          # All listings (with filters)
PUT    /admin/listings/:id/approve         # Approve listing
PUT    /admin/listings/:id/reject          # Reject listing
PUT    /admin/listings/:id/request-edit    # Request changes

GET    /admin/users             # All users
PUT    /admin/users/:id/suspend           # Suspend user
PUT    /admin/users/:id/reactivate        # Reactivate user

GET    /admin/bookings          # All bookings
GET    /admin/refunds           # Refund requests
POST   /admin/refunds/:id/approve         # Approve refund
POST   /admin/refunds/:id/reject          # Reject refund

GET    /admin/reports/revenue   # Revenue report
GET    /admin/reports/commissions         # Commission report
```

---

## 5. PAYMENT FLOW (VNPay)

```
┌──────────────────────────────────────────────────────────────┐
│  1. Create Booking                                           │
│  POST /bookings                                              │
│  → Returns: { bookingId, lockExpiresAt: +20min }            │
│  → Backend: Create PENDING_PAYMENT booking                  │
│  → Backend: Create CREATED payment + 20min lock             │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  2. Create Payment URL                                       │
│  POST /payments/:bookingId/create                            │
│  → Backend: Create VNPay payment URL                         │
│  → Update payment.status = PENDING                           │
│  → Response: { paymentUrl }                                 │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  3. Guest redirects to VNPay                                │
│  Browser → VNPay (QR or bank selection)                     │
│  VNPay processes payment                                     │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  4. VNPay Callback (IPN — background)                        │
│  POST /api/v1/payments/vnpay-ipn                            │
│  → Backend: Verify checksum                                  │
│  → Backend: Update payment status                            │
│  → If SUCCESS: Update booking to CONFIRMED                   │
│  → If FAILED: Keep PENDING_PAYMENT (guest can retry)         │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  5. VNPay Return (guest browser)                            │
│  GET /payments/vnpay-return?vnp_*                            │
│  → Backend: Verify checksum                                  │
│  → Redirect to /booking/:id/success or /booking/:id/failed   │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  6. Polling (backup if callback missed)                     │
│  GET /payments/:bookingId/status                            │
│  → Check DB payment status                                   │
│  → Stop polling when status ≠ PENDING or timeout 15min     │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. DEVELOPMENT PHASES

### Phase 1: Foundation (Week 1-2)
**Goal**: Setup project + Auth + Basic listing search

```
Tasks:
□ Setup monorepo (Turborepo)
□ Setup NestJS backend + Prisma + PostgreSQL
□ Setup Next.js web app + shadcn/ui
□ Setup React Native (Expo) — skeleton
□ Implement Auth (register, login, JWT)
□ Database migrations + Prisma Studio

Deliverables:
• Monorepo running locally
• User can register/login
• Basic project structure confirmed
```

### Phase 2: Listings & Search (Week 3-4)
**Goal**: Listings CRUD + Search + Guest browsing

```
Tasks:
□ Listing CRUD for hosts
□ Image upload (Cloudinary)
□ Search & filter API + UI
□ Listing detail page (gallery, map, amenities)
□ Calendar availability check (read-only for guests)

Deliverables:
• Hosts can create/edit listings (draft mode)
• Guests can search and view listings
• Map + amenities displayed
```

### Phase 3: Booking + Payment (Week 5-7)
**Goal**: Complete booking flow + VNPay

```
Tasks:
□ Booking creation with 20-min lock
□ Booking form (date picker, guest info, price calc)
□ VNPay integration (sandbox)
□ Payment flow with callbacks
□ Booking confirmation + status
□ Cancel booking with refund logic

Deliverables:
• Full booking flow works end-to-end
• VNPay payment (test mode)
• Cancel flow with refund calculation
```

### Phase 4: Host Tools (Week 8-9)
**Goal**: Host dashboard + Calendar management

```
Tasks:
□ Host application + admin approval
□ FullCalendar integration for hosts
□ Block dates (maintenance, owner blocked)
□ Booking requests view + accept/decline
□ Host dashboard (stats, earnings)

Deliverables:
• Host onboarding flow complete
• Calendar management works
• Host dashboard with stats
```

### Phase 5: Chat + Review (Week 10-11)
**Goal**: Communication + Social proof

```
Tasks:
□ Chat implementation (polling 5s)
□ Review submission + display
□ Review edit (48h window)
□ Host flag review (admin moderation)
□ Review reminders (email)

Deliverables:
• Chat works between guest/host
• Reviews displayed on listings
```

### Phase 6: Admin + Polish (Week 12-13)
**Goal**: Admin dashboard + Final polish

```
Tasks:
□ Admin dashboard
□ Admin listing review (approve/reject)
□ Admin user management (suspend)
□ Settlement calculation + cron
□ Email notifications
□ Final testing + bug fixes

Deliverables:
• Admin can manage platform
• Settlement runs correctly
• App production-ready
```

### Phase 7: Launch (Week 14+)
**Goal**: Production deployment

```
Tasks:
□ Production environment setup
□ VNPay production credentials
□ Firebase Cloud Messaging (push notifications)
□ Performance optimization
□ Monitoring + logging

Deliverables:
• App live at domain.com
• Monitoring active
```

---

## 7. KEY TECHNICAL DECISIONS

### 7.1 Booking Lock Strategy
```
1. Guest clicks "Đặt phòng"
2. Backend: Create booking with PENDING_PAYMENT
3. Backend: Set payment.lockExpiresAt = now + 20min
4. Frontend: Show countdown timer
5. If payment success → lock released, booking CONFIRMED
6. If timeout → cron job cancels booking, releases lock
```

### 7.2 Calendar Conflict Prevention
```
1. Host opens calendar
2. Frontend: GET /host/calendar/:id (includes blocks + bookings)
3. Host selects date range to block
4. Frontend: POST /host/calendar/:id/blocks
5. Backend: Check for existing bookings in range
   → If conflict → return error with booking info
6. Backend: Use optimistic lock (WHERE version = ?)
   → If version mismatch → return 409 Conflict
7. Frontend: Show error + refresh calendar
```

### 7.3 Chat Polling Strategy
```
1. On chat page mount → GET /bookings/:id/chat
2. SetInterval: every 5 seconds → GET /bookings/:id/chat?since=lastTimestamp
3. On send message → POST /bookings/:id/chat → optimistic update
4. Cleanup: clearInterval on unmount
```

### 7.4 Settlement Cron
```
Daily at 02:00 AM (off-peak):
1. SELECT * FROM bookings
   WHERE status = 'COMPLETED'
   AND createdAt >= CURRENT_DATE - INTERVAL '1 day'
   AND settlement IS NULL

2. For each booking:
   - Calculate: netAmount = totalAmount * 0.85
   - Create Settlement record
   - Initiate VNPay payout (if bank account valid)
   - On success → status = SETTLED
   - On fail → status = FAILED, retry next day (max 3)
```

---

## 8. INFRASTRUCTURE

### 8.1 Development
```
Local:
• PostgreSQL 15 (Docker)
• Redis (Docker)
• Node.js 20

Tools:
• Prisma Studio (DB GUI)
• Mailtrap (email testing)
• VNPay sandbox
```

### 8.2 Production (Suggested)
```
Hosting:           VPS (DigitalOcean / Vultr) hoặc Cloud (AWS/GCP)
Frontend:           Vercel (Next.js optimized) hoặc self-host
Backend:            Docker + Railway / Render
Database:           Supabase (PostgreSQL) hoặc self-host
Storage:            Cloudinary (free tier: 25GB)
Maps:               Google Maps API (free tier: 28k loads/month)
Payment:            VNPay production account
Monitoring:         Sentry (errors) + Grafana (metrics)
CI/CD:              GitHub Actions
```

### 8.3 Environment Variables
```
# Database
DATABASE_URL=postgresql://user:pass@host:5432/bookstay

# JWT
JWT_SECRET=xxx
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=xxx
JWT_REFRESH_EXPIRES_IN=30d

# VNPay
VNPAY_TMN_CODE=xxx
VNPAY_HASH_SECRET=xxx
VNPAY_URL=https://sandbox.vnpayment.vn
VNPAY_RETURN_URL=https://yourdomain.com/api/payments/vnpay-return

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Redis
REDIS_URL=redis://localhost:6379
```

---

## 9. OUT OF SCOPE (v1)

- OTA sync (Booking.com, Airbnb)
- Dynamic pricing engine
- WebSocket chat (polling only)
- iOS native app (Android + Web first)
- Multiple currency
- Loyalty/reward points
- Multi-language (VN only)

---

## 10. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| VNPay sandbox ≠ production | Payment fails on launch | Start production integration 2 weeks before launch |
| Calendar overbooking | Guest angry, refund | Optimistic lock + version field |
| Host bank account invalid | Settlement stuck | Validate on submit + retry + escalate |
| Large image uploads | Slow performance | Cloudinary transformations + compression |
| Admin bottleneck | Listings stuck | 24h SLA + auto-escalation |
| Concurrent booking | Double book | Database unique constraint + lock |

---

*Document này là technical plan dựa trên UX Spec v1.0. Stack và phases có thể điều chỉnh theo team size và budget.*
