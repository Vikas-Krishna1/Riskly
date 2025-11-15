from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
import yfinance as yf
import pandas as pd
import numpy as np
from database import get_portfolio_collection
from auth import get_current_user

analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])

@analytics_router.get("/{portfolio_id}")
async def get_portfolio_analytics(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    portfolios = get_portfolio_collection()
    
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")

    holdings = portfolio.get("holdings", [])
    if not holdings:
        return {"message": "Portfolio has no holdings to analyze."}

    all_series = []
    valid_holdings = []

    for holding in holdings:
        symbol = holding['symbol']
        try:
            # Use Ticker for more reliable single-symbol data retrieval
            ticker = yf.Ticker(symbol)
            stock_data = ticker.history(period="1y", auto_adjust=True)
            
            # Check if data is empty
            if stock_data.empty:
                print(f"Skipping symbol {symbol}: No data returned.")
                continue
            
            # Check if 'Close' column exists
            if 'Close' not in stock_data.columns:
                print(f"Skipping symbol {symbol}: 'Close' column not found.")
                continue
            
            # Get the Close series
            close_series = stock_data['Close']
            
            # Check if all values are null (using .all() which returns a scalar boolean)
            all_null = close_series.isnull().all()
            if all_null:
                print(f"Skipping symbol {symbol}: All Close prices are null.")
                continue
            
            # Rename the series with the symbol
            close_series = close_series.rename(symbol)
            all_series.append(close_series)
            valid_holdings.append(holding)

        except Exception as e:
            print(f"Skipping symbol {symbol} due to error: {e}")
            continue

    if not valid_holdings:
        raise HTTPException(status_code=400, detail="Could not retrieve valid financial data for any holdings.")

    # Concatenate all successful series into a single DataFrame, aligning by date index
    data = pd.concat(all_series, axis=1)
    
    # Forward-fill and then back-fill missing values for non-trading days
    data = data.ffill().bfill()

    # Drop any columns that are still entirely null after cleaning
    data.dropna(axis=1, how='all', inplace=True)
    
    # Final validation of holdings against the cleaned data
    final_valid_symbols = data.columns.tolist()
    holdings = [h for h in valid_holdings if h['symbol'] in final_valid_symbols]

    if not holdings:
         raise HTTPException(status_code=400, detail="Could not retrieve valid financial data for any holdings after cleaning.")

    # Portfolio Analytics
    latest_prices = data.iloc[-1]
    
    total_portfolio_value = 0
    holdings_analytics = []
    
    for holding in holdings:
        symbol = holding['symbol']
        shares = holding['shares']
        purchase_price = holding['purchasePrice']
        
        current_price = latest_prices[symbol]
        current_value = shares * current_price
        total_portfolio_value += current_value
        
        purchase_value = shares * purchase_price
        gain_loss = current_value - purchase_value
        
        holdings_analytics.append({
            "symbol": symbol,
            "shares": float(shares),
            "purchasePrice": float(purchase_price),
            "currentPrice": float(current_price),
            "currentValue": float(current_value),
            "purchaseValue": float(purchase_value),
            "gainLoss": float(gain_loss)
        })

    # Historical Portfolio Value
    portfolio_values = pd.DataFrame(index=data.index)
    for holding in holdings:
        symbol = holding['symbol']
        shares = holding['shares']
        portfolio_values[symbol] = data[symbol] * shares
    
    portfolio_values['Total'] = portfolio_values.sum(axis=1)

    # Returns
    returns = portfolio_values['Total'].pct_change().dropna()
    
    # Analytics
    daily_return = returns.mean()
    volatility = returns.std()
    sharpe_ratio = (daily_return / volatility * np.sqrt(252)) if volatility != 0 else 0.0  # Annualized
    
    # Handle NaN/Inf values
    if pd.isna(daily_return) or np.isinf(daily_return):
        daily_return = 0.0
    if pd.isna(volatility) or np.isinf(volatility):
        volatility = 0.0
    if pd.isna(sharpe_ratio) or np.isinf(sharpe_ratio):
        sharpe_ratio = 0.0

    # Format historical value with proper date serialization
    historical_df = portfolio_values[['Total']].reset_index()
    historical_df.columns = ['Date', 'Total']
    historical_df['Date'] = historical_df['Date'].dt.strftime('%Y-%m-%d')
    historical_value = historical_df.to_dict('records')

    return {
        "portfolioName": portfolio['name'],
        "totalPortfolioValue": float(total_portfolio_value),
        "analytics": {
            "dailyReturn": float(daily_return),
            "volatility": float(volatility),
            "sharpeRatio": float(sharpe_ratio)
        },
        "holdings": holdings_analytics,
        "historicalValue": historical_value
    }
