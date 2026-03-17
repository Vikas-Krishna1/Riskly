from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from database import get_portfolio_collection
from auth import get_current_user
from portfolios.analytics import get_portfolio_analytics
import yfinance as yf
import pandas as pd
import numpy as np

backtesting_router = APIRouter(prefix="/backtesting", tags=["Backtesting"])

class BacktestRequest(BaseModel):
    period: str = Field(..., description="1y, 3y, 5y, 10y, or custom date range")
    startDate: Optional[str] = Field(None, description="Custom start date (YYYY-MM-DD)")
    endDate: Optional[str] = Field(None, description="Custom end date (YYYY-MM-DD)")

@backtesting_router.post("/{portfolio_id}/backtest")
async def run_backtest(
    portfolio_id: str,
    backtest_request: BacktestRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Run backtest on portfolio using historical data.
    """
    portfolios = get_portfolio_collection()
    
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")
    
    # Get current portfolio holdings
    holdings = portfolio.get("holdings", [])
    if not holdings:
        raise HTTPException(
            status_code=400,
            detail="Portfolio has no holdings to backtest"
        )
    
    # Determine date range
    end_date = datetime.now()
    if backtest_request.endDate:
        try:
            end_date = datetime.strptime(backtest_request.endDate, "%Y-%m-%d")
        except:
            raise HTTPException(status_code=400, detail="Invalid end date format. Use YYYY-MM-DD")
    
    start_date = None
    if backtest_request.startDate:
        try:
            start_date = datetime.strptime(backtest_request.startDate, "%Y-%m-%d")
        except:
            raise HTTPException(status_code=400, detail="Invalid start date format. Use YYYY-MM-DD")
    else:
        # Use period string
        period_map = {
            "1y": timedelta(days=365),
            "3y": timedelta(days=3*365),
            "5y": timedelta(days=5*365),
            "10y": timedelta(days=10*365)
        }
        if backtest_request.period in period_map:
            start_date = end_date - period_map[backtest_request.period]
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid period. Use one of: {', '.join(period_map.keys())} or provide startDate/endDate"
            )
    
    if start_date >= end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    # Fetch historical data for all holdings
    all_series = []
    valid_holdings = []
    
    for holding in holdings:
        symbol = holding.get("symbol")
        shares = holding.get("shares", 0)
        purchase_price = holding.get("purchasePrice", 0)
        
        if not symbol or shares <= 0:
            continue
        
        try:
            ticker = yf.Ticker(symbol)
            stock_data = ticker.history(start=start_date, end=end_date + timedelta(days=1), auto_adjust=True)
            
            if stock_data.empty or 'Close' not in stock_data.columns:
                continue
            
            close_series = stock_data['Close']
            if close_series.isnull().all():
                continue
            
            all_series.append(close_series.rename(symbol))
            valid_holdings.append({
                "symbol": symbol,
                "shares": shares,
                "purchasePrice": purchase_price
            })
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            continue
    
    if not valid_holdings:
        raise HTTPException(
            status_code=400,
            detail="Could not retrieve historical data for any holdings"
        )
    
    # Combine all series into DataFrame
    data = pd.concat(all_series, axis=1)
    data = data.ffill().bfill()
    data.dropna(axis=1, how='all', inplace=True)
    
    if data.empty:
        raise HTTPException(
            status_code=400,
            detail="No valid historical data available for the specified period"
        )
    
    # Calculate portfolio value over time
    portfolio_values = pd.DataFrame(index=data.index)
    for holding in valid_holdings:
        symbol = holding["symbol"]
        if symbol in data.columns:
            shares = holding["shares"]
            portfolio_values[symbol] = data[symbol] * shares
    
    portfolio_values['Total'] = portfolio_values.sum(axis=1)
    
    # Calculate returns
    returns = portfolio_values['Total'].pct_change().dropna()
    
    # Calculate metrics
    initial_value = portfolio_values['Total'].iloc[0]
    final_value = portfolio_values['Total'].iloc[-1]
    total_return = ((final_value - initial_value) / initial_value) if initial_value > 0 else 0.0
    
    daily_return = returns.mean()
    volatility = returns.std()
    sharpe_ratio = (daily_return / volatility * np.sqrt(252)) if volatility != 0 else 0.0
    
    # Max drawdown
    cumulative = (1 + returns).cumprod()
    running_max = cumulative.expanding().max()
    drawdown = (cumulative - running_max) / running_max
    max_drawdown = drawdown.min()
    
    # Sortino ratio
    downside_returns = returns[returns < 0]
    downside_std = downside_returns.std() if len(downside_returns) > 0 else 0.0
    sortino_ratio = (daily_return / downside_std * np.sqrt(252)) if downside_std != 0 else 0.0
    
    # Annualized return
    days = (end_date - start_date).days
    years = days / 365.25
    annualized_return = ((final_value / initial_value) ** (1 / years) - 1) if years > 0 and initial_value > 0 else 0.0
    
    # Format historical value
    historical_value = []
    for date, value in portfolio_values['Total'].items():
        historical_value.append({
            "Date": date.strftime('%Y-%m-%d') if isinstance(date, pd.Timestamp) else str(date),
            "Value": float(value)
        })
    
    # Calculate best and worst days
    best_day = returns.idxmax()
    worst_day = returns.idxmin()
    best_day_return = returns.max()
    worst_day_return = returns.min()
    
    return {
        "portfolioId": portfolio_id,
        "startDate": start_date.strftime('%Y-%m-%d'),
        "endDate": end_date.strftime('%Y-%m-%d'),
        "period": f"{(end_date - start_date).days} days",
        "initialValue": round(float(initial_value), 2),
        "finalValue": round(float(final_value), 2),
        "totalReturn": round(total_return * 100, 2),
        "annualizedReturn": round(annualized_return * 100, 2),
        "metrics": {
            "sharpeRatio": round(float(sharpe_ratio), 4),
            "sortinoRatio": round(float(sortino_ratio), 4),
            "volatility": round(float(volatility) * 100, 2),
            "maxDrawdown": round(float(max_drawdown) * 100, 2),
            "dailyReturn": round(float(daily_return) * 100, 4)
        },
        "historicalValue": historical_value,
        "bestDay": {
            "date": best_day.strftime('%Y-%m-%d') if isinstance(best_day, pd.Timestamp) else str(best_day),
            "return": round(best_day_return * 100, 2)
        },
        "worstDay": {
            "date": worst_day.strftime('%Y-%m-%d') if isinstance(worst_day, pd.Timestamp) else str(worst_day),
            "return": round(worst_day_return * 100, 2)
        },
        "holdings": [
            {
                "symbol": h["symbol"],
                "shares": h["shares"],
                "initialValue": round(float(data[h["symbol"]].iloc[0] * h["shares"]), 2) if h["symbol"] in data.columns else 0,
                "finalValue": round(float(data[h["symbol"]].iloc[-1] * h["shares"]), 2) if h["symbol"] in data.columns else 0
            }
            for h in valid_holdings
        ]
    }

