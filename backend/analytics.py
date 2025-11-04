"""
Portfolio Analytics Service - Calculates risk metrics and portfolio statistics
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from datetime import datetime
import logging
from market_data import MarketDataService

logger = logging.getLogger(__name__)

class PortfolioAnalytics:
    """Service for portfolio risk analysis and metrics"""
    
    def __init__(self):
        self.market_data = MarketDataService()
    
    async def analyze_portfolio(
        self,
        holdings: List[Dict],
        portfolio_id: str
    ) -> Dict:
        """
        Comprehensive portfolio analysis
        
        Returns:
            - Expected Return
            - Volatility
            - Sharpe Ratio
            - Correlation Matrix
            - Sector Breakdown
        """
        try:
            if not holdings:
                return {
                    "portfolio_id": portfolio_id,
                    "error": "No holdings found",
                    "metrics": {},
                    "correlation_matrix": {},
                    "sector_breakdown": {}
                }
            
            # Get symbols and weights
            symbols = [h["symbol"] for h in holdings]
            quantities = {h["symbol"]: h["quantity"] for h in holdings}
            purchase_prices = {h["symbol"]: h.get("purchase_price", 0) for h in holdings}
            
            # Calculate portfolio weights
            total_value = sum(quantities[s] * purchase_prices.get(s, 0) for s in symbols)
            if total_value == 0:
                return {
                    "portfolio_id": portfolio_id,
                    "error": "Portfolio has zero value",
                    "metrics": {},
                    "correlation_matrix": {},
                    "sector_breakdown": {}
                }
            
            weights = {
                s: (quantities[s] * purchase_prices.get(s, 0)) / total_value 
                for s in symbols
            }
            
            # Fetch historical data for all symbols
            returns_data = {}
            current_prices = {}
            sector_data = {}
            
            for symbol in symbols:
                try:
                    # Get historical returns
                    hist_data = await self.market_data.get_historical_data(symbol, period="1y")
                    if not hist_data.empty:
                        returns = await self.market_data.calculate_returns(hist_data)
                        returns_data[symbol] = returns
                    
                    # Get current price and sector info
                    stock_info = await self.market_data.get_stock_info(symbol)
                    current_prices[symbol] = stock_info.get("current_price", purchase_prices.get(symbol, 0))
                    sector_data[symbol] = {
                        "sector": stock_info.get("sector", "Unknown"),
                        "industry": stock_info.get("industry", "Unknown")
                    }
                except Exception as e:
                    logger.warning(f"Could not fetch data for {symbol}: {e}")
                    continue
            
            # Calculate metrics
            metrics = await self._calculate_portfolio_metrics(
                returns_data, weights, current_prices, purchase_prices, quantities
            )
            
            # Calculate correlation matrix
            correlation_matrix = {}
            if returns_data:
                corr_df = await self.market_data.calculate_correlation_matrix(returns_data)
                correlation_matrix = corr_df.to_dict()
            
            # Calculate sector breakdown
            sector_breakdown = await self._calculate_sector_breakdown(
                symbols, weights, sector_data, current_prices, quantities
            )
            
            return {
                "portfolio_id": portfolio_id,
                "metrics": metrics,
                "correlation_matrix": correlation_matrix,
                "sector_breakdown": sector_breakdown,
                "current_value": sum(
                    current_prices.get(s, purchase_prices.get(s, 0)) * quantities[s] 
                    for s in symbols
                ),
                "total_cost": total_value,
                "total_return": sum(
                    (current_prices.get(s, purchase_prices.get(s, 0)) - purchase_prices.get(s, 0)) * quantities[s]
                    for s in symbols
                ),
            }
            
        except Exception as e:
            logger.error(f"Error analyzing portfolio: {e}")
            raise
    
    async def _calculate_portfolio_metrics(
        self,
        returns_data: Dict[str, pd.Series],
        weights: Dict[str, float],
        current_prices: Dict[str, float],
        purchase_prices: Dict[str, float],
        quantities: Dict[str, float]
    ) -> Dict:
        """Calculate portfolio risk metrics"""
        
        if not returns_data:
            return {
                "expected_return": 0.0,
                "volatility": 0.0,
                "sharpe_ratio": 0.0,
                "individual_returns": {},
                "individual_volatilities": {}
            }
        
        # Calculate individual stock metrics
        individual_returns = {}
        individual_volatilities = {}
        
        for symbol, returns in returns_data.items():
            if returns.empty:
                continue
            # Annualized return
            annual_return = (1 + returns.mean()) ** 252 - 1
            volatility = await self.market_data.calculate_volatility(returns)
            
            individual_returns[symbol] = annual_return
            individual_volatilities[symbol] = volatility
        
        # Calculate portfolio expected return (weighted average)
        portfolio_return = sum(
            individual_returns.get(s, 0) * weights.get(s, 0)
            for s in weights.keys()
        )
        
        # Calculate portfolio volatility
        # Simple approximation: weighted average (for now)
        # In production, use covariance matrix
        portfolio_volatility = sum(
            individual_volatilities.get(s, 0) * weights.get(s, 0)
            for s in weights.keys()
        )
        
        # Sharpe Ratio (assuming risk-free rate of 0.02 = 2%)
        risk_free_rate = 0.02
        sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_volatility if portfolio_volatility > 0 else 0
        
        return {
            "expected_return": round(portfolio_return * 100, 2),  # As percentage
            "volatility": round(portfolio_volatility * 100, 2),  # As percentage
            "sharpe_ratio": round(sharpe_ratio, 2),
            "individual_returns": {k: round(v * 100, 2) for k, v in individual_returns.items()},
            "individual_volatilities": {k: round(v * 100, 2) for k, v in individual_volatilities.items()}
        }
    
    async def _calculate_sector_breakdown(
        self,
        symbols: List[str],
        weights: Dict[str, float],
        sector_data: Dict[str, Dict],
        current_prices: Dict[str, float],
        quantities: Dict[str, float]
    ) -> Dict:
        """Calculate portfolio exposure by sector"""
        sector_allocation = {}
        
        for symbol in symbols:
            sector = sector_data.get(symbol, {}).get("sector", "Unknown")
            weight = weights.get(symbol, 0)
            
            if sector not in sector_allocation:
                sector_allocation[sector] = {
                    "weight": 0,
                    "value": 0,
                    "holdings": []
                }
            
            sector_allocation[sector]["weight"] += weight
            sector_allocation[sector]["value"] += (
                current_prices.get(symbol, 0) * quantities.get(symbol, 0)
            )
            sector_allocation[sector]["holdings"].append(symbol)
        
        # Convert weights to percentages
        for sector in sector_allocation:
            sector_allocation[sector]["weight"] = round(sector_allocation[sector]["weight"] * 100, 2)
            sector_allocation[sector]["value"] = round(sector_allocation[sector]["value"], 2)
        
        return sector_allocation

