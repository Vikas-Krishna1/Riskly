from fastapi import FastAPI
from users import users_router
from database import client
from portfolios.portfolios import portfolio_router
from portfolios.analytics import analytics_router
from portfolios.aiAnalysis import ai_analysis_router
from portfolios.transactions import transaction_router
from portfolios.healthScore import health_score_router
from portfolios.alerts import alert_router
from portfolios.rebalancing import rebalancing_router
from portfolios.correlationAnalysis import correlation_router
from portfolios.scenarioSimulator import scenario_router
from portfolios.taxOptimization import tax_router
from portfolios.backtesting import backtesting_router
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(portfolio_router)
app.include_router(analytics_router)
app.include_router(ai_analysis_router)
app.include_router(transaction_router)
app.include_router(health_score_router)
app.include_router(alert_router)
app.include_router(rebalancing_router)
app.include_router(correlation_router)
app.include_router(scenario_router)
app.include_router(tax_router)
app.include_router(backtesting_router)


@app.get("/")
async def root():
    return {"message": "✅ API is working"}

@app.on_event("shutdown")
def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)