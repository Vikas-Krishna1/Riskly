from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
import yfinance as yf
import pandas as pd
import numpy as np
from database import get_portfolio_collection, get_health_score_collection
from auth import get_current_user
from portfolios.analytics import get_portfolio_analytics

health_score_router = APIRouter(prefix="/health-score", tags=["Health Score"])

def calculate_diversification_score(holdings_analytics, attribution_data):
    """Calculate diversification score based on sector/industry distribution"""
    if not attribution_data or not attribution_data.get("bySector"):
        return 50.0  # Default score if no sector data
    
    sector_data = attribution_data["bySector"]
    num_sectors = len(sector_data)
    
    # Calculate Herfindahl index for sectors
    total_value = sum(s["totalCurrentValue"] for s in sector_data)
    if total_value == 0:
        return 0.0
    
    herfindahl = sum((s["totalCurrentValue"] / total_value) ** 2 for s in sector_data)
    
    # Convert to score (0-100)
    # Lower Herfindahl = better diversification
    # Perfect diversification (equal weights) = 1/n, worst = 1
    max_herfindahl = 1.0
    min_herfindahl = 1.0 / max(num_sectors, 1)
    
    if max_herfindahl == min_herfindahl:
        diversification_score = 50.0
    else:
        # Normalize: (max - actual) / (max - min) * 100
        diversification_score = ((max_herfindahl - herfindahl) / (max_herfindahl - min_herfindahl)) * 100
        diversification_score = max(0, min(100, diversification_score))
    
    # Bonus for number of sectors (more sectors = better)
    sector_bonus = min(10, num_sectors * 2)
    diversification_score = min(100, diversification_score + sector_bonus)
    
    return round(diversification_score, 2)

def calculate_risk_adjusted_score(analytics):
    """Calculate risk-adjusted return score based on Sharpe and Sortino ratios"""
    sharpe = analytics.get("sharpeRatio", 0)
    sortino = analytics.get("sortinoRatio", 0)
    
    # Normalize Sharpe ratio (typical range: -1 to 3, good > 1)
    sharpe_score = min(100, max(0, (sharpe + 1) / 4 * 100))
    
    # Normalize Sortino ratio (similar to Sharpe, good > 1)
    sortino_score = min(100, max(0, (sortino + 1) / 4 * 100))
    
    # Average of both
    risk_adjusted_score = (sharpe_score + sortino_score) / 2
    return round(risk_adjusted_score, 2)

def calculate_concentration_score(analytics):
    """Calculate concentration risk score (lower concentration = better)"""
    concentration = analytics.get("concentration", 1.0)
    
    # Herfindahl index: 1 = worst (all in one), 1/n = best (equal weights)
    # Convert to score: lower concentration = higher score
    concentration_score = (1 - concentration) * 100
    concentration_score = max(0, min(100, concentration_score))
    
    return round(concentration_score, 2)

def calculate_performance_score(analytics, benchmark_comparison):
    """Calculate performance score based on returns and benchmark comparison"""
    total_return = analytics.get("totalReturn", 0)
    annualized_return = analytics.get("annualizedReturn", 0)
    
    # Base score from returns (normalize: -50% to +50% range)
    return_score = min(100, max(0, (total_return + 0.5) / 1.0 * 100))
    
    # Benchmark comparison bonus
    benchmark_bonus = 0
    if benchmark_comparison:
        avg_outperformance = sum(
            b.get("outperformance", 0) for b in benchmark_comparison.values()
        ) / len(benchmark_comparison) if benchmark_comparison else 0
        
        # Bonus for outperforming benchmarks
        if avg_outperformance > 0:
            benchmark_bonus = min(20, avg_outperformance * 100)
    
    performance_score = min(100, return_score + benchmark_bonus)
    return round(performance_score, 2)

def calculate_risk_score(analytics):
    """Calculate risk management score (lower risk metrics = better)"""
    max_drawdown = abs(analytics.get("maxDrawdown", 0))
    var_95 = abs(analytics.get("valueAtRisk", 0))
    volatility = analytics.get("volatility", 0)
    
    # Normalize each metric
    # Max drawdown: 0% = 100, -50% = 0
    drawdown_score = max(0, min(100, (1 - max_drawdown * 2) * 100))
    
    # VaR: 0% = 100, -10% = 0
    var_score = max(0, min(100, (1 - var_95 * 10) * 100))
    
    # Volatility: 0% = 100, 50% = 0
    volatility_score = max(0, min(100, (1 - volatility * 2) * 100))
    
    # Average of all risk metrics
    risk_score = (drawdown_score + var_score + volatility_score) / 3
    return round(risk_score, 2)

@health_score_router.get("/{portfolio_id}")
async def get_portfolio_health_score(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Calculate and return portfolio health score (0-100) with category breakdown.
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
        return {
            "portfolioId": portfolio_id,
            "portfolioName": portfolio.get("name", "Portfolio"),
            "healthScore": 0,
            "categories": {
                "diversification": {"score": 0, "maxScore": 25},
                "riskAdjustedReturns": {"score": 0, "maxScore": 25},
                "concentration": {"score": 0, "maxScore": 20},
                "performance": {"score": 0, "maxScore": 20},
                "riskManagement": {"score": 0, "maxScore": 10}
            },
            "suggestions": ["Add holdings to calculate health score"],
            "timestamp": datetime.utcnow().isoformat()
        }
    
    analytics = analytics_data.get("analytics", {})
    attribution = analytics_data.get("attribution", {})
    benchmark_comparison = analytics_data.get("benchmarkComparison", {})
    holdings_analytics = analytics_data.get("holdings", [])
    
    # Calculate category scores
    diversification_score = calculate_diversification_score(holdings_analytics, attribution)
    risk_adjusted_score = calculate_risk_adjusted_score(analytics)
    concentration_score = calculate_concentration_score(analytics)
    performance_score = calculate_performance_score(analytics, benchmark_comparison)
    risk_score = calculate_risk_score(analytics)
    
    # Weighted composite score
    weights = {
        "diversification": 0.25,
        "riskAdjustedReturns": 0.25,
        "concentration": 0.20,
        "performance": 0.20,
        "riskManagement": 0.10
    }
    
    composite_score = (
        diversification_score * weights["diversification"] +
        risk_adjusted_score * weights["riskAdjustedReturns"] +
        concentration_score * weights["concentration"] +
        performance_score * weights["performance"] +
        risk_score * weights["riskManagement"]
    )
    
    composite_score = round(composite_score, 2)
    
    # Generate suggestions
    suggestions = []
    if diversification_score < 60:
        suggestions.append("Consider diversifying across more sectors to reduce concentration risk")
    if risk_adjusted_score < 50:
        suggestions.append("Improve risk-adjusted returns by optimizing portfolio allocation")
    if concentration_score < 50:
        suggestions.append("Reduce portfolio concentration by spreading investments across more holdings")
    if performance_score < 50:
        suggestions.append("Portfolio underperforming - consider reviewing holdings and strategy")
    if risk_score < 50:
        suggestions.append("High risk detected - consider reducing volatility and drawdown exposure")
    if not suggestions:
        suggestions.append("Portfolio health is good - maintain current strategy")
    
    # Store historical health score
    health_scores = get_health_score_collection()
    await health_scores.insert_one({
        "portfolioId": ObjectId(portfolio_id),
        "healthScore": composite_score,
        "categories": {
            "diversification": diversification_score,
            "riskAdjustedReturns": risk_adjusted_score,
            "concentration": concentration_score,
            "performance": performance_score,
            "riskManagement": risk_score
        },
        "timestamp": datetime.utcnow()
    })
    
    return {
        "portfolioId": portfolio_id,
        "portfolioName": analytics_data.get("portfolioName", portfolio.get("name", "Portfolio")),
        "healthScore": composite_score,
        "categories": {
            "diversification": {"score": diversification_score, "maxScore": 25},
            "riskAdjustedReturns": {"score": risk_adjusted_score, "maxScore": 25},
            "concentration": {"score": concentration_score, "maxScore": 20},
            "performance": {"score": performance_score, "maxScore": 20},
            "riskManagement": {"score": risk_score, "maxScore": 10}
        },
        "suggestions": suggestions,
        "timestamp": datetime.utcnow().isoformat()
    }

@health_score_router.get("/{portfolio_id}/history")
async def get_health_score_history(
    portfolio_id: str,
    limit: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """
    Get historical health scores for a portfolio.
    """
    portfolios = get_portfolio_collection()
    
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")
    
    health_scores = get_health_score_collection()
    
    history = await health_scores.find(
        {"portfolioId": ObjectId(portfolio_id)}
    ).sort("timestamp", -1).limit(limit).to_list(length=limit)
    
    result = []
    for record in history:
        result.append({
            "healthScore": record.get("healthScore", 0),
            "categories": record.get("categories", {}),
            "timestamp": record.get("timestamp").isoformat() if isinstance(record.get("timestamp"), datetime) else record.get("timestamp")
        })
    
    return {
        "portfolioId": portfolio_id,
        "history": result
    }

