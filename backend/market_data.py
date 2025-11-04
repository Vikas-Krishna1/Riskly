"""
Market Data Service - Fetches real-time stock data using yfinance
"""
import yfinance as yf
import pandas as pd
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class MarketDataService:
    """Service for fetching and processing market data"""
    
    @staticmethod
    async def get_stock_info(symbol: str) -> Dict:
        """Get current stock information"""
        try:
            ticker = yf.Ticker(symbol.upper())
            info = ticker.info
            
            return {
                "symbol": symbol.upper(),
                "name": info.get("longName", symbol.upper()),
                "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "currency": info.get("currency", "USD"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "market_cap": info.get("marketCap"),
                "volume": info.get("volume"),
                "52w_high": info.get("fiftyTwoWeekHigh"),
                "52w_low": info.get("fiftyTwoWeekLow"),
            }
        except Exception as e:
            logger.error(f"Error fetching stock info for {symbol}: {e}")
            raise
    
    @staticmethod
    async def get_historical_data(
        symbol: str, 
        period: str = "1y",
        interval: str = "1d"
    ) -> pd.DataFrame:
        """Get historical price data"""
        try:
            ticker = yf.Ticker(symbol.upper())
            data = ticker.history(period=period, interval=interval)
            return data
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {e}")
            raise
    
    @staticmethod
    async def get_multiple_stocks_data(symbols: List[str]) -> Dict[str, Dict]:
        """Get data for multiple stocks efficiently"""
        try:
            # Fetch all tickers at once
            tickers = yf.Tickers(" ".join([s.upper() for s in symbols]))
            results = {}
            
            for symbol in symbols:
                try:
                    ticker = tickers.tickers[symbol.upper()]
                    info = ticker.info
                    
                    results[symbol.upper()] = {
                        "symbol": symbol.upper(),
                        "name": info.get("longName", symbol.upper()),
                        "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
                        "currency": info.get("currency", "USD"),
                        "sector": info.get("sector"),
                        "industry": info.get("industry"),
                    }
                except Exception as e:
                    logger.warning(f"Could not fetch data for {symbol}: {e}")
                    results[symbol.upper()] = {
                        "symbol": symbol.upper(),
                        "name": symbol.upper(),
                        "current_price": None,
                        "error": str(e)
                    }
            
            return results
        except Exception as e:
            logger.error(f"Error fetching multiple stocks data: {e}")
            raise
    
    @staticmethod
    async def calculate_returns(data: pd.DataFrame) -> pd.Series:
        """Calculate daily returns"""
        if data.empty or "Close" not in data.columns:
            return pd.Series()
        return data["Close"].pct_change().dropna()
    
    @staticmethod
    async def calculate_volatility(returns: pd.Series, period: int = 252) -> float:
        """Calculate annualized volatility"""
        if returns.empty:
            return 0.0
        return returns.std() * (period ** 0.5)
    
    @staticmethod
    async def calculate_correlation_matrix(returns_data: Dict[str, pd.Series]) -> pd.DataFrame:
        """Calculate correlation matrix for multiple stocks"""
        if not returns_data:
            return pd.DataFrame()
        
        # Combine all returns into a DataFrame
        df = pd.DataFrame(returns_data)
        return df.corr()

