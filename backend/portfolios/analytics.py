from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import timedelta
from typing import List
import yfinance as yf
import pandas as pd
import numpy as np
from database import get_portfolio_collection
from auth import get_current_user

analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])

@analytics_router.get("/compare")
async def compare_portfolios(
    portfolio_ids: str = Query(..., description="Comma-separated list of portfolio IDs"),
    current_user: dict = Depends(get_current_user)
):
    """
    Compare multiple portfolios side-by-side.
    Returns analytics for each portfolio and overlay charts data.
    """
    portfolios = get_portfolio_collection()
    
    # Parse portfolio IDs from query string
    portfolio_id_list = [pid.strip() for pid in portfolio_ids.split(",") if pid.strip()]
    
    if len(portfolio_id_list) < 2:
        raise HTTPException(status_code=400, detail="At least 2 portfolios are required for comparison")
    
    if len(portfolio_id_list) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 portfolios can be compared at once")
    
    comparison_data = []
    
    for portfolio_id in portfolio_id_list:
        try:
            portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
            
            if not portfolio:
                continue
            
            # Security: verify ownership
            if str(portfolio["userId"]) != current_user["id"]:
                continue
            
            # Get analytics for this portfolio (reuse existing function logic)
            holdings = portfolio.get("holdings", [])
            if not holdings:
                continue
            
            all_series = []
            valid_holdings = []
            
            for holding in holdings:
                symbol = holding['symbol']
                try:
                    ticker = yf.Ticker(symbol)
                    stock_data = ticker.history(period="1y", auto_adjust=True)
                    
                    if stock_data.empty or 'Close' not in stock_data.columns:
                        continue
                    
                    close_series = stock_data['Close']
                    if close_series.isnull().all():
                        continue
                    
                    close_series = close_series.rename(symbol)
                    all_series.append(close_series)
                    valid_holdings.append(holding)
                except Exception as e:
                    print(f"Skipping symbol {symbol} due to error: {e}")
                    continue
            
            if not valid_holdings:
                continue
            
            # Process data
            data = pd.concat(all_series, axis=1)
            data = data.ffill().bfill()
            data.dropna(axis=1, how='all', inplace=True)
            
            final_valid_symbols = data.columns.tolist()
            holdings = [h for h in valid_holdings if h['symbol'] in final_valid_symbols]
            
            if not holdings:
                continue
            
            # Calculate portfolio value
            latest_prices = data.iloc[-1]
            total_portfolio_value = 0
            
            for holding in holdings:
                symbol = holding['symbol']
                shares = holding['shares']
                current_price = latest_prices[symbol]
                total_portfolio_value += shares * current_price
            
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
            sharpe_ratio = (daily_return / volatility * np.sqrt(252)) if volatility != 0 else 0.0
            
            cumulative = (1 + returns).cumprod()
            running_max = cumulative.expanding().max()
            drawdown = (cumulative - running_max) / running_max
            max_drawdown = drawdown.min()
            
            downside_returns = returns[returns < 0]
            downside_std = downside_returns.std() if len(downside_returns) > 0 else 0.0
            sortino_ratio = (daily_return / downside_std * np.sqrt(252)) if downside_std != 0 else 0.0
            
            annualized_return = daily_return * 252
            calmar_ratio = (annualized_return / abs(max_drawdown)) if max_drawdown != 0 else 0.0
            
            initial_value = portfolio_values['Total'].iloc[0]
            final_value = portfolio_values['Total'].iloc[-1]
            total_return = ((final_value - initial_value) / initial_value) if initial_value != 0 else 0.0
            
            # Safe float helper
            def safe_float(value):
                if pd.isna(value) or np.isinf(value):
                    return 0.0
                return float(value)
            
            # Format historical value
            historical_df = portfolio_values[['Total']].reset_index()
            historical_df.columns = ['Date', 'Total']
            historical_df['Date'] = historical_df['Date'].dt.strftime('%Y-%m-%d')
            historical_value = historical_df.to_dict('records')
            
            comparison_data.append({
                "portfolioId": portfolio_id,
                "portfolioName": portfolio['name'],
                "totalPortfolioValue": safe_float(total_portfolio_value),
                "analytics": {
                    "dailyReturn": safe_float(daily_return),
                    "volatility": safe_float(volatility),
                    "sharpeRatio": safe_float(sharpe_ratio),
                    "maxDrawdown": safe_float(max_drawdown),
                    "sortinoRatio": safe_float(sortino_ratio),
                    "calmarRatio": safe_float(calmar_ratio),
                    "totalReturn": safe_float(total_return),
                    "annualizedReturn": safe_float(annualized_return)
                },
                "historicalValue": historical_value
            })
            
        except Exception as e:
            print(f"Error processing portfolio {portfolio_id}: {e}")
            continue
    
    if len(comparison_data) < 2:
        raise HTTPException(status_code=400, detail="Could not retrieve valid data for at least 2 portfolios")
    
    return {
        "portfolios": comparison_data,
        "count": len(comparison_data)
    }

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
    
    # Basic Analytics
    daily_return = returns.mean()
    volatility = returns.std()
    sharpe_ratio = (daily_return / volatility * np.sqrt(252)) if volatility != 0 else 0.0  # Annualized
    
    # Additional Metrics
    # Maximum Drawdown
    cumulative = (1 + returns).cumprod()
    running_max = cumulative.expanding().max()
    drawdown = (cumulative - running_max) / running_max
    max_drawdown = drawdown.min()
    
    # Sortino Ratio (downside deviation)
    downside_returns = returns[returns < 0]
    downside_std = downside_returns.std() if len(downside_returns) > 0 else 0.0
    sortino_ratio = (daily_return / downside_std * np.sqrt(252)) if downside_std != 0 else 0.0
    
    # Calmar Ratio (annualized return / max drawdown)
    annualized_return = daily_return * 252
    calmar_ratio = (annualized_return / abs(max_drawdown)) if max_drawdown != 0 else 0.0
    
    # Total Return
    initial_value = portfolio_values['Total'].iloc[0]
    final_value = portfolio_values['Total'].iloc[-1]
    total_return = ((final_value - initial_value) / initial_value) if initial_value != 0 else 0.0
    
    # Win Rate (percentage of profitable holdings)
    profitable_holdings = sum(1 for h in holdings_analytics if h['gainLoss'] > 0)
    win_rate = (profitable_holdings / len(holdings_analytics) * 100) if len(holdings_analytics) > 0 else 0.0
    
    # Best and Worst Performing Holdings
    best_holding = max(holdings_analytics, key=lambda x: x['gainLoss']) if holdings_analytics else None
    worst_holding = min(holdings_analytics, key=lambda x: x['gainLoss']) if holdings_analytics else None
    
    # Portfolio Concentration (Herfindahl Index)
    total_value = sum(h['currentValue'] for h in holdings_analytics)
    concentration = sum((h['currentValue'] / total_value) ** 2 for h in holdings_analytics) if total_value > 0 else 0.0
    
    # Value at Risk (VaR) - 95% confidence
    var_95 = returns.quantile(0.05) if len(returns) > 0 else 0.0
    
    # Expected Shortfall (Conditional VaR)
    expected_shortfall = returns[returns <= var_95].mean() if len(returns[returns <= var_95]) > 0 else 0.0
    
    # Beta (correlation with market - using SPY as proxy)
    market_returns = None
    beta = 0.0
    try:
        market_data = yf.Ticker("SPY").history(period="1y", auto_adjust=True)
        if not market_data.empty and 'Close' in market_data.columns:
            market_returns = market_data['Close'].pct_change().dropna()
            # Align dates
            aligned_returns = returns.reindex(market_returns.index).dropna()
            aligned_market = market_returns.reindex(aligned_returns.index).dropna()
            if len(aligned_returns) > 1 and len(aligned_market) > 1:
                market_var = aligned_market.var()
                beta = (aligned_returns.cov(aligned_market) / market_var) if market_var != 0 else 0.0
    except:
        beta = 0.0
    
    # Alpha (excess return over market)
    if market_returns is not None:
        market_annual_return = market_returns.mean() * 252
        alpha = annualized_return - (beta * market_annual_return)
    else:
        alpha = 0.0
    
    # Information Ratio
    if market_returns is not None:
        aligned_market_for_ir = market_returns.reindex(returns.index).fillna(0)
        tracking_error = (returns - aligned_market_for_ir).std()
        excess_return = returns.mean() - aligned_market_for_ir.mean()
        information_ratio = (excess_return / tracking_error * np.sqrt(252)) if tracking_error != 0 else 0.0
    else:
        information_ratio = 0.0
    
    # Treynor Ratio
    treynor_ratio = (annualized_return / beta) if beta != 0 else 0.0
    
    # Handle NaN/Inf values
    def safe_float(value):
        if pd.isna(value) or np.isinf(value):
            return 0.0
        return float(value)
    
    daily_return = safe_float(daily_return)
    volatility = safe_float(volatility)
    sharpe_ratio = safe_float(sharpe_ratio)
    max_drawdown = safe_float(max_drawdown)
    sortino_ratio = safe_float(sortino_ratio)
    calmar_ratio = safe_float(calmar_ratio)
    total_return = safe_float(total_return)
    win_rate = safe_float(win_rate)
    concentration = safe_float(concentration)
    var_95 = safe_float(var_95)
    expected_shortfall = safe_float(expected_shortfall)
    beta = safe_float(beta)
    alpha = safe_float(alpha)
    information_ratio = safe_float(information_ratio)
    treynor_ratio = safe_float(treynor_ratio)
    annualized_return = safe_float(annualized_return)

    # Fetch benchmark data (SPY, QQQ, DIA)
    benchmarks = {}
    benchmark_symbols = {
        "SPY": "S&P 500",
        "QQQ": "NASDAQ 100",
        "DIA": "Dow Jones"
    }
    
    # Get the date range from portfolio data
    start_date = data.index[0]
    end_date = data.index[-1]
    
    for symbol, name in benchmark_symbols.items():
        try:
            benchmark_ticker = yf.Ticker(symbol)
            benchmark_data = benchmark_ticker.history(start=start_date, end=end_date + timedelta(days=1), auto_adjust=True)
            
            if not benchmark_data.empty and 'Close' in benchmark_data.columns:
                # Align benchmark data to portfolio date index using forward fill
                benchmark_close = benchmark_data['Close']
                
                # Reindex to match portfolio dates, forward fill missing values
                aligned_benchmark = benchmark_close.reindex(data.index, method='ffill')
                # Backfill any remaining NaN values at the start
                aligned_benchmark = aligned_benchmark.bfill()
                
                # Calculate normalized value (starting at portfolio's initial value for comparison)
                if not aligned_benchmark.empty and aligned_benchmark.notna().any():
                    # Get first valid price
                    first_valid_idx = aligned_benchmark.first_valid_index()
                    if first_valid_idx is not None:
                        initial_benchmark_price = aligned_benchmark.loc[first_valid_idx]
                        if initial_benchmark_price > 0:
                            # Normalize benchmark to start at portfolio's initial value
                            normalized_benchmark = (aligned_benchmark / initial_benchmark_price) * initial_value
                            
                            # Calculate benchmark returns using original prices
                            benchmark_returns = benchmark_close.pct_change().dropna()
                            benchmark_total_return = ((benchmark_close.iloc[-1] - benchmark_close.iloc[0]) / benchmark_close.iloc[0]) if benchmark_close.iloc[0] > 0 else 0.0
                            benchmark_annualized_return = benchmark_returns.mean() * 252 if len(benchmark_returns) > 0 else 0.0
                            benchmark_volatility = benchmark_returns.std() if len(benchmark_returns) > 0 else 0.0
                            
                            # Format historical benchmark data aligned with portfolio dates
                            benchmark_historical = []
                            for date in data.index:
                                if date in normalized_benchmark.index:
                                    value = normalized_benchmark.loc[date]
                                    if pd.notna(value):
                                        benchmark_historical.append({
                                            "Date": date.strftime('%Y-%m-%d'),
                                            "Value": float(value)
                                        })
                            
                            if benchmark_historical:  # Only add if we have data
                                benchmarks[symbol] = {
                                    "name": name,
                                    "totalReturn": safe_float(benchmark_total_return),
                                    "annualizedReturn": safe_float(benchmark_annualized_return),
                                    "volatility": safe_float(benchmark_volatility),
                                    "historicalValue": benchmark_historical
                                }
        except Exception as e:
            print(f"Failed to fetch benchmark {symbol}: {e}")
            continue
    
    # Calculate relative performance vs benchmarks
    benchmark_comparison = {}
    for symbol, benchmark_data in benchmarks.items():
        portfolio_outperformance = annualized_return - benchmark_data["annualizedReturn"]
        portfolio_total_outperformance = total_return - benchmark_data["totalReturn"]
        
        benchmark_comparison[symbol] = {
            "name": benchmark_data["name"],
            "outperformance": safe_float(portfolio_outperformance),
            "totalOutperformance": safe_float(portfolio_total_outperformance),
            "benchmarkReturn": benchmark_data["totalReturn"],
            "benchmarkAnnualizedReturn": benchmark_data["annualizedReturn"]
        }

    # Format historical value with proper date serialization
    historical_df = portfolio_values[['Total']].reset_index()
    historical_df.columns = ['Date', 'Total']
    historical_df['Date'] = historical_df['Date'].dt.strftime('%Y-%m-%d')
    historical_value = historical_df.to_dict('records')

    return {
        "portfolioName": portfolio['name'],
        "totalPortfolioValue": float(total_portfolio_value),
        "analytics": {
            "dailyReturn": daily_return,
            "volatility": volatility,
            "sharpeRatio": sharpe_ratio,
            "maxDrawdown": max_drawdown,
            "sortinoRatio": sortino_ratio,
            "calmarRatio": calmar_ratio,
            "totalReturn": total_return,
            "annualizedReturn": annualized_return,
            "winRate": win_rate,
            "concentration": concentration,
            "valueAtRisk": var_95,
            "expectedShortfall": expected_shortfall,
            "beta": beta,
            "alpha": alpha,
            "informationRatio": information_ratio,
            "treynorRatio": treynor_ratio
        },
        "holdings": holdings_analytics,
        "historicalValue": historical_value,
        "benchmarks": benchmarks,
        "benchmarkComparison": benchmark_comparison,
        "bestHolding": {
            "symbol": best_holding['symbol'],
            "gainLoss": best_holding['gainLoss'],
            "gainLossPercent": ((best_holding['gainLoss'] / best_holding['purchaseValue']) * 100) if best_holding['purchaseValue'] != 0 else 0.0
        } if best_holding else None,
        "worstHolding": {
            "symbol": worst_holding['symbol'],
            "gainLoss": worst_holding['gainLoss'],
            "gainLossPercent": ((worst_holding['gainLoss'] / worst_holding['purchaseValue']) * 100) if worst_holding['purchaseValue'] != 0 else 0.0
        } if worst_holding else None
    }
