from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from database import get_portfolio_collection
from auth import get_current_user
from portfolios.analytics import get_portfolio_analytics
import yfinance as yf
import pandas as pd

rebalancing_router = APIRouter(prefix="/rebalancing", tags=["Rebalancing"])

class TargetAllocation(BaseModel):
    symbol: str
    targetPercent: float = Field(..., ge=0, le=100, description="Target allocation percentage")

class SetTargetAllocations(BaseModel):
    allocations: List[TargetAllocation] = Field(..., description="List of target allocations")
    tolerance: float = Field(5.0, ge=0, le=50, description="Rebalancing tolerance band in percentage")

class RebalancingSuggestion(BaseModel):
    symbol: str
    action: str  # "BUY", "SELL", "HOLD"
    currentShares: float
    targetShares: float
    sharesToTrade: float
    currentValue: float
    targetValue: float
    currentPercent: float
    targetPercent: float
    drift: float  # Difference between current and target percentage

@rebalancing_router.post("/{portfolio_id}/target-allocations")
async def set_target_allocations(
    portfolio_id: str,
    allocations_data: SetTargetAllocations,
    current_user: dict = Depends(get_current_user)
):
    """Set target allocations for a portfolio"""
    portfolios = get_portfolio_collection()
    
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")
    
    # Validate that total allocation doesn't exceed 100%
    total_allocation = sum(a.targetPercent for a in allocations_data.allocations)
    if total_allocation > 100:
        raise HTTPException(
            status_code=400,
            detail=f"Total allocation ({total_allocation}%) cannot exceed 100%"
        )
    
    # Convert to dict format for storage
    target_allocations = {
        a.symbol: {
            "targetPercent": a.targetPercent,
            "tolerance": allocations_data.tolerance
        }
        for a in allocations_data.allocations
    }
    
    # Update portfolio with target allocations
    await portfolios.update_one(
        {"_id": ObjectId(portfolio_id)},
        {"$set": {"targetAllocations": target_allocations}}
    )
    
    return {
        "message": "Target allocations set successfully",
        "allocations": {a.symbol: a.targetPercent for a in allocations_data.allocations},
        "tolerance": allocations_data.tolerance
    }

@rebalancing_router.get("/{portfolio_id}/target-allocations")
async def get_target_allocations(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get target allocations for a portfolio"""
    portfolios = get_portfolio_collection()
    
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")
    
    target_allocations = portfolio.get("targetAllocations", {})
    
    if not target_allocations:
        return {
            "message": "No target allocations set",
            "allocations": {},
            "tolerance": 5.0
        }
    
    # Extract tolerance (assume same for all, or get from first)
    tolerance = 5.0
    if target_allocations:
        first_allocation = next(iter(target_allocations.values()))
        tolerance = first_allocation.get("tolerance", 5.0)
    
    allocations = {
        symbol: data.get("targetPercent", 0)
        for symbol, data in target_allocations.items()
    }
    
    return {
        "allocations": allocations,
        "tolerance": tolerance
    }

@rebalancing_router.get("/{portfolio_id}/suggestions")
async def get_rebalancing_suggestions(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user),
    consider_tolerance: bool = True
):
    """Get rebalancing suggestions for a portfolio"""
    portfolios = get_portfolio_collection()
    
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")
    
    # Get target allocations
    target_allocations = portfolio.get("targetAllocations", {})
    if not target_allocations:
        raise HTTPException(
            status_code=400,
            detail="No target allocations set. Please set target allocations first."
        )
    
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
    total_portfolio_value = analytics_data.get("totalPortfolioValue", 0)
    
    if total_portfolio_value == 0:
        raise HTTPException(
            status_code=400,
            detail="Portfolio has zero value"
        )
    
    # Extract tolerance
    tolerance = 5.0
    if target_allocations:
        first_allocation = next(iter(target_allocations.values()))
        tolerance = first_allocation.get("tolerance", 5.0)
    
    suggestions = []
    
    # Calculate current allocations and drift
    for holding in holdings:
        symbol = holding["symbol"]
        current_value = holding["currentValue"]
        current_percent = (current_value / total_portfolio_value * 100) if total_portfolio_value > 0 else 0
        
        # Get target allocation for this symbol
        target_data = target_allocations.get(symbol)
        if not target_data:
            # Symbol not in target allocations, suggest to remove or set target
            suggestions.append({
                "symbol": symbol,
                "action": "SELL",
                "currentShares": holding["shares"],
                "targetShares": 0,
                "sharesToTrade": -holding["shares"],
                "currentValue": current_value,
                "targetValue": 0,
                "currentPercent": current_percent,
                "targetPercent": 0,
                "drift": current_percent
            })
            continue
        
        target_percent = target_data.get("targetPercent", 0)
        drift = current_percent - target_percent
        
        # Check if rebalancing is needed
        needs_rebalancing = True
        if consider_tolerance:
            needs_rebalancing = abs(drift) > tolerance
        
        if not needs_rebalancing:
            suggestions.append({
                "symbol": symbol,
                "action": "HOLD",
                "currentShares": holding["shares"],
                "targetShares": holding["shares"],
                "sharesToTrade": 0,
                "currentValue": current_value,
                "targetValue": current_value,
                "currentPercent": current_percent,
                "targetPercent": target_percent,
                "drift": drift
            })
            continue
        
        # Calculate target value and shares
        target_value = (total_portfolio_value * target_percent / 100)
        current_price = holding["currentPrice"]
        
        if current_price == 0:
            continue
        
        target_shares = target_value / current_price
        shares_to_trade = target_shares - holding["shares"]
        
        action = "HOLD"
        if shares_to_trade > 0.01:  # Small threshold to avoid tiny trades
            action = "BUY"
        elif shares_to_trade < -0.01:
            action = "SELL"
        
        suggestions.append({
            "symbol": symbol,
            "action": action,
            "currentShares": holding["shares"],
            "targetShares": round(target_shares, 2),
            "sharesToTrade": round(shares_to_trade, 2),
            "currentValue": current_value,
            "targetValue": round(target_value, 2),
            "currentPercent": round(current_percent, 2),
            "targetPercent": target_percent,
            "drift": round(drift, 2)
        })
    
    # Check for target allocations that don't have holdings
    for symbol, target_data in target_allocations.items():
        if not any(h["symbol"] == symbol for h in holdings):
            target_percent = target_data.get("targetPercent", 0)
            target_value = (total_portfolio_value * target_percent / 100)
            
            # Try to get current price
            try:
                ticker = yf.Ticker(symbol)
                current_data = ticker.history(period="1d")
                if not current_data.empty:
                    current_price = float(current_data["Close"].iloc[-1])
                    target_shares = target_value / current_price
                    
                    suggestions.append({
                        "symbol": symbol,
                        "action": "BUY",
                        "currentShares": 0,
                        "targetShares": round(target_shares, 2),
                        "sharesToTrade": round(target_shares, 2),
                        "currentValue": 0,
                        "targetValue": round(target_value, 2),
                        "currentPercent": 0,
                        "targetPercent": target_percent,
                        "drift": -target_percent
                    })
            except:
                pass
    
    # Calculate summary
    total_drift = sum(abs(s["drift"]) for s in suggestions)
    needs_rebalancing_count = sum(1 for s in suggestions if s["action"] != "HOLD")
    
    return {
        "portfolioId": portfolio_id,
        "totalPortfolioValue": total_portfolio_value,
        "tolerance": tolerance,
        "suggestions": suggestions,
        "summary": {
            "totalDrift": round(total_drift, 2),
            "needsRebalancing": needs_rebalancing_count > 0,
            "holdingsNeedingRebalancing": needs_rebalancing_count,
            "totalHoldings": len(suggestions)
        }
    }

