# 🚀 Riskly - AI-Powered Portfolio Risk Analyzer

## ✅ Implemented Features

### Core Infrastructure
- ✅ User Authentication (JWT)
- ✅ Portfolio Management (CRUD)
- ✅ Holdings Management
- ✅ Dashboard with Portfolio Overview
- ✅ Security Hardening (Rate Limiting, CORS, Input Validation)

### 🆕 New Risk Analytics Features

#### 1. Real-Time Market Data Integration
- **Service**: `backend/market_data.py`
- **API**: yfinance integration
- **Features**:
  - Current stock prices and information
  - Historical price data (1 year)
  - Multi-stock data fetching
  - Returns and volatility calculations

#### 2. Portfolio Risk Analytics
- **Service**: `backend/analytics.py`
- **Metrics Calculated**:
  - ✅ Expected Return (annualized)
  - ✅ Volatility (risk level)
  - ✅ Sharpe Ratio (risk-adjusted performance)
  - ✅ Correlation Matrix (diversification quality)
  - ✅ Sector Breakdown (risk exposure by industry)

#### 3. AI-Powered Risk Reports
- **Service**: `backend/ai_service.py`
- **Features**:
  - Natural-language risk analysis
  - GPT-4 powered insights
  - Comprehensive risk assessment
  - Actionable recommendations
  - Fallback report when AI unavailable

#### 4. Analytics Dashboard
- **Frontend**: `frontend/src/pages/Analytics/Analytics.tsx`
- **Visualizations** (Plotly):
  - Correlation Heatmap
  - Sector Breakdown Pie Chart
  - Individual Stock Returns Bar Chart
- **Features**:
  - Real-time portfolio analysis
  - Interactive charts
  - AI risk report display
  - Sector allocation table

## 📊 API Endpoints

### Analytics Endpoints

```
GET /api/analytics/portfolio/{portfolio_id}
- Get comprehensive portfolio analysis
- Query params: include_ai_report=true/false

GET /api/analytics/portfolio/{portfolio_id}/metrics
- Get quick metrics (without AI report)

GET /api/analytics/portfolio/{portfolio_id}/ai-report
- Get AI-generated risk report only
```

## 🔧 Setup Instructions

### Backend Setup

1. **Install Dependencies**:
```bash
cd backend
pip install -r requirements.txt
```

2. **Environment Variables** (`.env`):
```env
# Database
MONGO_DETAILS=mongodb://localhost:27017
DB_NAME=riskly

# Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI (Optional - for AI reports)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo

# Security
ENVIRONMENT=development  # or production
FRONTEND_URL=http://localhost:5173
ENABLE_RATE_LIMITING=true
RATE_LIMIT_PER_MINUTE=60
```

3. **Start Backend**:
```bash
python main.py
# or
uvicorn main:app --reload
```

### Frontend Setup

1. **Install Dependencies**:
```bash
cd frontend
npm install
```

2. **Start Frontend**:
```bash
npm run dev
```

## 📈 Usage

1. **Create Portfolio**: Go to Dashboard → Create Portfolio
2. **Add Holdings**: Search for stocks and add with quantity/price
3. **View Analytics**: Navigate to Analytics page
4. **Select Portfolio**: Choose portfolio to analyze
5. **View Metrics**: See risk metrics, charts, and AI report

## 🎯 Key Metrics Explained

### Expected Return
- Annualized projected return based on historical performance
- Calculated as weighted average of individual stock returns

### Volatility
- Portfolio risk level (standard deviation of returns)
- Higher = more risk
- Annualized percentage

### Sharpe Ratio
- Risk-adjusted return metric
- Formula: (Return - Risk-Free Rate) / Volatility
- Higher = better risk-adjusted performance
- > 1 = Good, > 2 = Excellent

### Correlation Matrix
- Shows how stocks move together
- Values range from -1 to +1
- Lower correlation = better diversification
- High correlation = concentrated risk

### Sector Breakdown
- Portfolio allocation by industry
- Helps identify sector concentration risk
- Diversified = lower risk

## 🤖 AI Risk Report

The AI report provides:
- Overall risk assessment (Low/Medium/High)
- Key portfolio strengths
- Main risk factors
- Diversification analysis
- Specific recommendations
- Outlook and suggestions

**Note**: Requires `OPENAI_API_KEY` in environment variables.

## 🛠️ Tech Stack

### Backend
- FastAPI - Async API framework
- MongoDB - Database
- yfinance - Market data
- OpenAI - AI risk reports
- pandas/numpy - Data analysis

### Frontend
- React + TypeScript
- Plotly.js - Interactive charts
- React Router - Navigation
- Context API - State management

## 🔒 Security Features

- ✅ Rate limiting (60 req/min default)
- ✅ CORS configuration
- ✅ Input validation
- ✅ Password strength requirements
- ✅ JWT authentication
- ✅ User ownership verification

## 📝 Next Steps (Future Enhancements)

- [ ] Real-time price updates via WebSockets
- [ ] Portfolio performance tracking over time
- [ ] Alert system for risk thresholds
- [ ] Export reports (PDF/CSV)
- [ ] Comparison with market benchmarks
- [ ] Monte Carlo simulation
- [ ] Risk scenario analysis
- [ ] Mobile app support

## 🐛 Troubleshooting

### AI Reports Not Working
- Check `OPENAI_API_KEY` is set
- Verify API key is valid
- Check API quota/limits

### Market Data Errors
- yfinance may have rate limits
- Some symbols may not be available
- Check internet connection

### Charts Not Displaying
- Ensure Plotly dependencies installed
- Check browser console for errors
- Verify portfolio has holdings

## 📞 Support

For issues or questions, check:
- Backend logs for API errors
- Browser console for frontend errors
- MongoDB connection status

---

**Built with ❤️ by Vikas Krishna & Raymond Flores**

