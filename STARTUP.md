# BookStay - Startup Scripts

# ============================================
# WINDOWS - Run these commands in PowerShell
# ============================================

# 1. Start Docker Database
docker compose up -d

# 2. Start Backend API
cd services/api
npm install
npm run db:generate
npm run db:push
npm run dev
# Backend runs at http://localhost:3001

# 3. In another terminal, start Web Frontend
cd apps/web
npm install
npm run dev
# Web runs at http://localhost:3000

# ============================================
# STOPPING SERVICES
# ============================================

# Stop Docker
docker compose down

# Stop API (Ctrl+C in terminal)

# ============================================
# SEED DEMO DATA (optional)
# ============================================
cd services/api
npm run db:seed

# ============================================
# COMMON ISSUES
# ============================================

# Issue: Docker not running
# Fix: Start Docker Desktop app

# Issue: Port 3001 already in use
# Fix: Change PORT in .env or kill the process using that port

# Issue: npm install fails
# Fix: Clear cache - npm cache clean --force
