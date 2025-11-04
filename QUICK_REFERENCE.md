# 🚀 Riskly - Quick Reference Card

## 📍 All API Endpoints

### Base URL: `http://localhost:8000/api`

```
# Authentication
POST   /api/users/register
POST   /api/users/login
GET    /api/users/me                    [Auth Required]

# Portfolios
POST   /api/portfolios/                 [Auth Required]
GET    /api/portfolios/                 [Auth Required]
GET    /api/portfolios/{id}             [Auth Required]
PUT    /api/portfolios/{id}             [Auth Required]
DELETE /api/portfolios/{id}             [Auth Required]

# Holdings
GET    /api/holdings/search?query=...   [Auth Required]
POST   /api/holdings/                   [Auth Required]
GET    /api/holdings/portfolio/{id}     [Auth Required]
DELETE /api/holdings/{id}               [Auth Required]

# Analytics
GET    /api/analytics/portfolio/{id}?include_ai_report=true  [Auth Required]
GET    /api/analytics/portfolio/{id}/metrics                 [Auth Required]
GET    /api/analytics/portfolio/{id}/ai-report              [Auth Required]
```

## 🗄️ Database Collections

**Database:** `riskly`

1. **users** - `{email, username, password}`
2. **portfolios** - `{name, description, symbols, user_email, timestamps}`
3. **holdings** - `{portfolio_id, symbol, name, quantity, purchase_price, user_email, added_at}`

## 🔐 Required .env Variables

```env
# MUST HAVE
MONGO_DETAILS=mongodb://localhost:27017
DB_NAME=riskly
SECRET_KEY=your-secret-key-here

# OPTIONAL (for AI reports)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4
```

## 📄 Frontend Routes

- `/` → `/home` (public)
- `/login` (public)
- `/register` (public)
- `/about` (public)
- `/dashboard` (protected) ⚠️
- `/portfolio` (protected) ⚠️
- `/analytics` (protected) ⚠️

## ✅ Test Flow

1. Register → `/register`
2. Auto-login → Redirects to `/dashboard`
3. Create Portfolio → Dashboard or `/portfolio`
4. Add Holdings → Dashboard search
5. View Analytics → `/analytics`

## 🎯 Key Features

- ✅ 15 API endpoints
- ✅ 7 Frontend pages
- ✅ 3 Database collections
- ✅ JWT authentication
- ✅ Real-time market data
- ✅ AI risk reports
- ✅ Interactive charts

---

**Full Details**: See `PROJECT_AUDIT.md`

