# 🚀 Quick Start Guide - Riskly

## Prerequisites Check

```bash
# Check Python (need 3.8+)
python --version

# Check Node.js (need 16+)
node --version

# Check npm
npm --version
```

---

## 🎯 3-Step Quick Start

### Step 1: Setup Backend (Terminal 1)

```bash
# Navigate to backend
cd backend

# Install dependencies
# For Python 3.9: pip install -r requirements-py39.txt
# For Python 3.10+: pip install -r requirements.txt
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_DETAILS=mongodb://localhost:27017
DB_NAME=riskly
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
ENABLE_RATE_LIMITING=true
RATE_LIMIT_PER_MINUTE=60
EOF

# Start MongoDB (if local)
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
# Windows: net start MongoDB

# Start backend server
python main.py
```

**Backend runs on**: http://localhost:8000  
**API Docs**: http://localhost:8000/docs

---

### Step 2: Setup Frontend (Terminal 2)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs on**: http://localhost:5173

---

### Step 3: Test the Application

1. **Open Browser**: http://localhost:5173

2. **Register Account**:
   - Click "Sign Up"
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test1234` (must have letter + number)

3. **Create Portfolio**:
   - Dashboard → "Create Portfolio"
   - Name: `My Portfolio`
   - Click "Create"

4. **Add Holdings**:
   - Search: `AAPL` or `Apple`
   - Click result
   - Quantity: `10`, Price: `150`
   - Click "Add Holding"
   - Add more: `GOOGL`, `MSFT`

5. **View Analytics**:
   - Click "Analytics" in navbar
   - Select portfolio
   - View metrics and charts!

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check MongoDB is running
mongosh  # Should connect

# Check Python version
python --version  # Need 3.8+

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend won't start
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Can't connect to backend
- Check backend is running on port 8000
- Check `http://localhost:8000` in browser
- Verify CORS settings in backend `.env`

### Analytics not loading
- Wait 10-30 seconds (fetching market data)
- Check browser console for errors
- Verify holdings have quantity > 0
- Try popular stocks: AAPL, MSFT, GOOGL

---

## 📝 Optional: Enable AI Reports

Add to `backend/.env`:
```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4
```

Restart backend server.

---

## ✅ Test Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Can register new user
- [ ] Can login
- [ ] Can create portfolio
- [ ] Can add holdings
- [ ] Analytics page loads
- [ ] Charts display correctly
- [ ] Metrics calculate properly

---

## 🎉 You're Ready!

For detailed testing instructions, see `TESTING_GUIDE.md`

