# Riskly
# Riskly 📊

> Advanced portfolio analytics with AI-powered insights. Track performance, analyze risk, and get personalized investment recommendations.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

## 🔗 Live Demo
[riskly.vercel.app](https://riskly-281gs7ean-vikas-krishna1s-projects.vercel.app)

---

## Features

### 📈 Portfolio Risk Analysis
- Computes **16+ professional-grade financial metrics** on real-time stock data including:
  - Sharpe Ratio, Sortino Ratio
  - Beta, Alpha
  - Volatility, Value at Risk (VaR)
  - And more

### 🏥 Portfolio Health Score
A proprietary composite scoring algorithm that evaluates your portfolio across **5 categories**:
- **Diversification** — How well-spread are your holdings?
- **Concentration** — Are you overexposed to any single asset?
- **Risk-Adjusted Returns** — Are you being compensated for your risk?
- **Performance** — How is the portfolio performing overall?
- **Risk Management** — How well is downside risk being managed?

Each category is scored and combined into a single 0–100 health score with actionable improvement suggestions.

### 🤖 AI-Powered Insights
- Integrates **OpenAI GPT-4 API** to generate personalized portfolio summaries
- AI insights are grounded in your actual computed risk metrics — not generic advice
- Get specific recommendations based on your Sharpe Ratio, concentration risk, and more

### 🔐 Secure User Accounts
- JWT-based authentication
- Secure portfolio storage per user account
- Build, save, and analyze custom stock portfolios

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | MongoDB |
| Auth | JWT |
| Market Data | Yahoo Finance API |
| AI | OpenAI GPT-4 API |
| Deployment | Vercel (frontend), Render (backend) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB instance
- OpenAI API key
- Yahoo Finance API access

### Installation

```bash
# Clone the repository
git clone https://github.com/vikaskrishna/riskly.git
cd riskly

# Backend setup
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your API keys to .env

# Frontend setup
cd ../frontend
npm install
cp .env.example .env.local
# Add your environment variables
```

### Running Locally

```bash
# Start backend
cd backend
uvicorn main:app --reload

# Start frontend (new terminal)
cd frontend
npm run dev
```

---

## Environment Variables

```env
# Backend
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Project Structure

```
riskly/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
├── backend/           # FastAPI application
│   ├── routers/
│   ├── models/
│   ├── services/
│   │   ├── risk_engine.py      # Core metrics computation
│   │   ├── health_score.py     # Portfolio Health Score algorithm
│   │   └── ai_insights.py      # GPT-4 integration
│   └── main.py
```

---

## Author

**Vikas Krishna** — [@vikaskrishna](https://github.com/vikaskrishna)

*Built as part of independent full-stack development work at Stony Brook University*
