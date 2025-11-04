# 🧪 Riskly Testing Guide

## Quick Start

### Prerequisites
- Python 3.8+ installed
- Node.js 16+ and npm installed
- MongoDB running (local or cloud)
- (Optional) OpenAI API key for AI reports

---

## Step 1: Backend Setup

### 1.1 Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note**: If you encounter issues:
- **Python 3.9 users**: Use `pip install -r requirements-py39.txt`
- **Python 3.10+ users**: Use `pip install -r requirements.txt`
- **Upgrade pip**: `pip install --upgrade pip`
- **Version conflicts**: Try `pip install --upgrade pip` then reinstall

### 1.2 Create Environment File

Create a `.env` file in the `backend` directory:

```bash
cd backend
touch .env
```

Add these variables to `.env`:

```env
# Database Configuration
MONGO_DETAILS=mongodb://localhost:27017
# OR use MongoDB Atlas:
# MONGO_DETAILS=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=riskly

# Authentication
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Configuration (Optional - for AI risk reports)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4

# Security Settings
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
ENABLE_RATE_LIMITING=true
RATE_LIMIT_PER_MINUTE=60
```

### 1.3 Start MongoDB

**Option A: Local MongoDB**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Option B: MongoDB Atlas (Cloud)**
- Sign up at https://www.mongodb.com/cloud/atlas
- Get your connection string
- Update `MONGO_DETAILS` in `.env`

### 1.4 Start Backend Server

```bash
cd backend
python main.py
```

**OR** using uvicorn directly:
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
✅ MongoDB client initialized
Using database: riskly
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Test Backend**: Open http://localhost:8000
- Should see: `{"message": "✅ API is working"}`

**API Docs**: http://localhost:8000/docs
- Swagger UI for testing endpoints

---

## Step 2: Frontend Setup

### 2.1 Install Node Dependencies

```bash
cd frontend
npm install
```

**Note**: If you encounter issues:
```bash
npm install --legacy-peer-deps
```

### 2.2 Start Frontend Development Server

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Frontend will be available at**: http://localhost:5173

---

## Step 3: Testing the Application

### 3.1 Create Test User

1. Open http://localhost:5173
2. Click "Sign Up" or navigate to `/register`
3. Fill in:
   - **Username**: `testuser` (3-30 chars, alphanumeric + underscore)
   - **Email**: `test@example.com`
   - **Password**: `Test1234` (min 8 chars, must have letter + number)
4. Click "Sign Up"
5. You'll be automatically logged in and redirected to Dashboard

### 3.2 Create a Portfolio

1. On Dashboard, click "Create Portfolio" or go to `/portfolio`
2. Fill in:
   - **Name**: `Tech Portfolio`
   - **Description**: `My tech stocks`
   - **Symbols**: (optional, can add later)
3. Click "Create"
4. Portfolio appears in the list

### 3.3 Add Holdings

1. **On Dashboard**:
   - Select your portfolio
   - Search for stocks (e.g., "AAPL", "Apple", "MSFT")
   - Click on a search result
   - Enter:
     - **Quantity**: `10`
     - **Purchase Price**: `150.00`
   - Click "Add Holding"

2. **Add multiple stocks**:
   - Try: AAPL, GOOGL, MSFT, TSLA
   - Each with different quantities and prices

### 3.4 View Analytics

1. Navigate to `/analytics` (click "Analytics" in navbar)
2. Select your portfolio from dropdown
3. Wait for analysis to complete (may take 10-30 seconds)
4. You should see:
   - **Key Metrics**: Expected Return, Volatility, Sharpe Ratio
   - **Correlation Heatmap**: Shows how stocks move together
   - **Sector Breakdown**: Pie chart of sector allocation
   - **Individual Returns**: Bar chart of expected returns
   - **AI Risk Report**: (if OPENAI_API_KEY is set)

### 3.5 Test API Endpoints

**Using Browser**:
- http://localhost:8000/docs - Swagger UI
- Test endpoints directly

**Using curl**:
```bash
# Register user
curl -X POST http://localhost:8000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test1234"}'

# Login
curl -X POST http://localhost:8000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Get portfolios (use token from login)
curl -X GET http://localhost:8000/api/portfolios/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get analytics
curl -X GET "http://localhost:8000/api/analytics/portfolio/PORTFOLIO_ID?include_ai_report=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Common Issues & Solutions

### Backend Issues

**Issue**: `ModuleNotFoundError: No module named 'yfinance'`
```bash
pip install yfinance
```

**Issue**: `MongoDB connection failed`
- Check MongoDB is running: `mongosh` or `mongo`
- Verify connection string in `.env`
- Check firewall/network settings

**Issue**: `SECRET_KEY not found`
- Make sure `.env` file exists in `backend/` directory
- Check `.env` file has `SECRET_KEY=...`

**Issue**: `Port 8000 already in use`
```bash
# Find process using port 8000
lsof -i :8000
# Kill it or change port in main.py
```

### Frontend Issues

**Issue**: `npm install fails`
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

**Issue**: `Plotly charts not showing`
- Check browser console for errors
- Verify `plotly.js` and `react-plotly.js` installed
- Try: `npm install plotly.js react-plotly.js`

**Issue**: `CORS errors`
- Make sure backend is running on port 8000
- Check `FRONTEND_URL` in backend `.env` matches frontend URL
- In development, CORS allows all origins

### Analytics Issues

**Issue**: `Analytics loading forever`
- Check backend logs for errors
- Verify yfinance can fetch data (check internet)
- Some stock symbols may not be available
- Try with popular stocks: AAPL, MSFT, GOOGL

**Issue**: `AI report not showing`
- Check `OPENAI_API_KEY` is set in `.env`
- Verify API key is valid
- Check OpenAI API quota/limits
- Report will show "AI report generation failed" if error

**Issue**: `No data in charts`
- Make sure portfolio has holdings
- Holdings need quantity > 0
- Historical data may not be available for all symbols

---

## Testing Checklist

### Authentication
- [ ] Register new user
- [ ] Login with credentials
- [ ] Logout
- [ ] Protected routes redirect to login
- [ ] Token persists on page refresh

### Portfolio Management
- [ ] Create portfolio
- [ ] View all portfolios
- [ ] Edit portfolio
- [ ] Delete portfolio
- [ ] Portfolio ownership verified

### Holdings Management
- [ ] Search for stocks
- [ ] Add holding to portfolio
- [ ] View holdings list
- [ ] Delete holding
- [ ] Holdings linked to correct portfolio

### Analytics
- [ ] View portfolio metrics
- [ ] Correlation heatmap displays
- [ ] Sector breakdown chart shows
- [ ] Returns chart displays
- [ ] AI report generates (if API key set)
- [ ] Metrics calculate correctly

### Security
- [ ] Rate limiting works (try 60+ requests quickly)
- [ ] Invalid tokens rejected
- [ ] Users can only access own data
- [ ] Password validation works
- [ ] Input validation prevents malicious input

---

## Quick Test Script

```bash
# Terminal 1: Start MongoDB (if local)
mongod

# Terminal 2: Start Backend
cd backend
python main.py

# Terminal 3: Start Frontend
cd frontend
npm run dev

# Browser: Open http://localhost:5173
```

---

## Performance Testing

### Load Testing
```bash
# Install Apache Bench or use similar tool
ab -n 100 -c 10 http://localhost:8000/api/portfolios/
```

### Test with Multiple Users
1. Register multiple test accounts
2. Create portfolios for each
3. Add holdings
4. Test analytics for each portfolio

---

## Debugging Tips

### Backend Logging
- Check terminal output for errors
- MongoDB connection errors will show on startup
- API errors logged in FastAPI

### Frontend Debugging
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls
- Verify Authorization headers present

### Database Inspection
```bash
# Connect to MongoDB
mongosh

# Use database
use riskly

# View collections
show collections

# View users
db.users.find()

# View portfolios
db.portfolios.find()

# View holdings
db.holdings.find()
```

---

## Next Steps After Testing

1. **Add more holdings** - Test with 10+ stocks
2. **Test different portfolios** - Create multiple portfolios
3. **Test edge cases** - Empty portfolios, invalid symbols, etc.
4. **Test AI reports** - Get OpenAI API key for full functionality
5. **Performance test** - Test with large portfolios

---

## Support

If you encounter issues:
1. Check error messages in console/logs
2. Verify all environment variables set
3. Check MongoDB is running
4. Verify all dependencies installed
5. Check network connectivity (for yfinance)

Happy Testing! 🚀

