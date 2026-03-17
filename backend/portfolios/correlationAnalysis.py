from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from typing import Dict, List
from database import get_portfolio_collection
from auth import get_current_user
from portfolios.analytics import get_portfolio_analytics
import yfinance as yf
import pandas as pd
import numpy as np

correlation_router = APIRouter(prefix="/correlation", tags=["Correlation Analysis"])

@correlation_router.get("/{portfolio_id}")
async def get_correlation_analysis(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Calculate correlation matrix and diversification metrics for a portfolio.
    """
    portfolios = get_portfolio_collection()
    
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")
    
    # Get portfolio analytics
    try:
        analytics_data = await get_portfolio_analytics(
            portfolio_id=portfolio_id,
            current_user=current_user
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch portfolio analytics: {str(e)}"
        )
    
    if "message" in analytics_data:
        raise HTTPException(
            status_code=400,
            detail="Portfolio has no holdings to analyze"
        )
    
    holdings = analytics_data.get("holdings", [])
    if len(holdings) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 holdings are required for correlation analysis"
        )
    
    symbols = [h["symbol"] for h in holdings]
    
    # Fetch historical data for all symbols
    all_returns = {}
    valid_symbols = []
    
    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            stock_data = ticker.history(period="1y", auto_adjust=True)
            
            if stock_data.empty or 'Close' not in stock_data.columns:
                continue
            
            close_series = stock_data['Close']
            if close_series.isnull().all():
                continue
            
            # Calculate returns
            returns = close_series.pct_change().dropna()
            if len(returns) > 0:
                all_returns[symbol] = returns
                valid_symbols.append(symbol)
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            continue
    
    if len(valid_symbols) < 2:
        raise HTTPException(
            status_code=400,
            detail="Could not retrieve sufficient data for correlation analysis"
        )
    
    # Align all returns to common date index
    returns_df = pd.DataFrame(all_returns)
    returns_df = returns_df.dropna()
    
    if len(returns_df) < 30:  # Need at least 30 days of data
        raise HTTPException(
            status_code=400,
            detail="Insufficient historical data for correlation analysis"
        )
    
    # Calculate correlation matrix
    correlation_matrix = returns_df.corr()
    
    # Convert to list format for JSON
    correlation_data = []
    for i, symbol1 in enumerate(valid_symbols):
        row = {"symbol": symbol1}
        for symbol2 in valid_symbols:
            if symbol1 == symbol2:
                row[symbol2] = 1.0
            else:
                corr_value = correlation_matrix.loc[symbol1, symbol2]
                if pd.isna(corr_value):
                    row[symbol2] = 0.0
                else:
                    row[symbol2] = round(float(corr_value), 4)
        correlation_data.append(row)
    
    # Calculate diversification score
    # Lower average correlation = better diversification
    correlation_values = []
    for i, symbol1 in enumerate(valid_symbols):
        for j, symbol2 in enumerate(valid_symbols):
            if i < j:  # Only count each pair once
                corr = correlation_matrix.loc[symbol1, symbol2]
                if not pd.isna(corr):
                    correlation_values.append(abs(corr))
    
    if correlation_values:
        avg_correlation = np.mean(correlation_values)
        # Convert to score (0-100): lower correlation = higher score
        # Perfect diversification (0 correlation) = 100, high correlation (0.9+) = 0
        diversification_score = max(0, min(100, (1 - avg_correlation) * 100))
    else:
        diversification_score = 50.0
        avg_correlation = 0.5
    
    # Identify highly correlated pairs (redundancy detection)
    highly_correlated = []
    for i, symbol1 in enumerate(valid_symbols):
        for j, symbol2 in enumerate(valid_symbols):
            if i < j:
                corr = correlation_matrix.loc[symbol1, symbol2]
                if not pd.isna(corr) and abs(corr) > 0.7:
                    highly_correlated.append({
                        "symbol1": symbol1,
                        "symbol2": symbol2,
                        "correlation": round(float(corr), 4)
                    })
    
    # Get sector information for diversification suggestions
    sector_info = {}
    for symbol in valid_symbols:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            sector = info.get('sector', 'Unknown')
            industry = info.get('industry', 'Unknown')
            sector_info[symbol] = {
                "sector": sector,
                "industry": industry
            }
        except:
            sector_info[symbol] = {
                "sector": "Unknown",
                "industry": "Unknown"
            }
    
    # Sector overlap analysis
    sector_distribution = {}
    for symbol, info in sector_info.items():
        sector = info["sector"]
        if sector not in sector_distribution:
            sector_distribution[sector] = []
        sector_distribution[sector].append(symbol)
    
    # Generate diversification suggestions
    suggestions = []
    if diversification_score < 60:
        suggestions.append("Portfolio shows high correlation between holdings. Consider diversifying across different sectors or asset classes.")
    
    if len(highly_correlated) > 0:
        suggestions.append(f"{len(highly_correlated)} pair(s) of holdings are highly correlated (>0.7). Consider reducing overlap.")
    
    if len(sector_distribution) < 3:
        suggestions.append("Portfolio is concentrated in few sectors. Consider adding holdings from different sectors.")
    
    if not suggestions:
        suggestions.append("Portfolio shows good diversification. Maintain current allocation strategy.")
    
    return {
        "portfolioId": portfolio_id,
        "symbols": valid_symbols,
        "correlationMatrix": correlation_data,
        "diversificationScore": round(diversification_score, 2),
        "averageCorrelation": round(avg_correlation, 4),
        "highlyCorrelated": highly_correlated,
        "sectorInfo": sector_info,
        "sectorDistribution": {sector: len(symbols) for sector, symbols in sector_distribution.items()},
        "suggestions": suggestions,
        "dataPoints": len(returns_df)
    }

