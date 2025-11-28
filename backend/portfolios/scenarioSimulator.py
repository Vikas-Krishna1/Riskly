from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from database import get_portfolio_collection
from auth import get_current_user
from portfolios.analytics import get_portfolio_analytics
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

scenario_router = APIRouter(prefix="/scenarios", tags=["Scenario Simulator"])

class ScenarioRequest(BaseModel):
    scenarioType: str = Field(..., description="MARKET_CRASH, RECESSION, SECTOR_ROTATION, INTEREST_RATE_SHOCK, CUSTOM")
    customAdjustments: Optional[Dict[str, float]] = Field(None, description="For CUSTOM: symbol -> percentage change")
    marketCrashPercent: float = Field(-20.0, description="For MARKET_CRASH: percentage drop")
    sectorRotation: Optional[Dict[str, float]] = Field(None, description="For SECTOR_ROTATION: sector -> percentage change")

PREDEFINED_SCENARIOS = {
    "MARKET_CRASH": {
        "name": "Market Crash (-20%)",
        "description": "Simulates a broad market decline of 20%",
        "adjustment": -0.20
    },
    "RECESSION": {
        "name": "Recession Scenario",
        "description": "Simulates economic recession with varied sector impacts",
        "sector_adjustments": {
            "Technology": -0.25,
            "Financial Services": -0.30,
            "Consumer Cyclical": -0.35,
            "Healthcare": -0.10,
            "Consumer Defensive": -0.05,
            "Utilities": -0.05
        }
    },
    "SECTOR_ROTATION": {
        "name": "Sector Rotation",
        "description": "Simulates rotation from growth to value sectors",
        "sector_adjustments": {
            "Technology": -0.15,
            "Financial Services": 0.10,
            "Energy": 0.15,
            "Utilities": 0.05
        }
    },
    "INTEREST_RATE_SHOCK": {
        "name": "Interest Rate Shock",
        "description": "Simulates sudden interest rate increase",
        "sector_adjustments": {
            "Financial Services": 0.05,
            "Real Estate": -0.20,
            "Utilities": -0.15,
            "Technology": -0.10
        }
    }
}

@scenario_router.post("/{portfolio_id}/simulate")
async def simulate_scenario(
    portfolio_id: str,
    scenario: ScenarioRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Simulate portfolio performance under a given scenario.
    """
    portfolios = get_portfolio_collection()
    
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")
    
    # Get current portfolio analytics
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
            detail="Portfolio has no holdings to simulate"
        )
    
    holdings = analytics_data.get("holdings", [])
    current_total_value = analytics_data.get("totalPortfolioValue", 0)
    
    if current_total_value == 0:
        raise HTTPException(
            status_code=400,
            detail="Portfolio has zero value"
        )
    
    # Apply scenario adjustments
    scenario_holdings = []
    total_scenario_value = 0
    
    for holding in holdings:
        symbol = holding["symbol"]
        current_value = holding["currentValue"]
        current_price = holding["currentPrice"]
        shares = holding["shares"]
        
        adjustment = 0.0
        
        if scenario.scenarioType == "MARKET_CRASH":
            adjustment = scenario.marketCrashPercent / 100
        
        elif scenario.scenarioType == "CUSTOM":
            if scenario.customAdjustments and symbol in scenario.customAdjustments:
                adjustment = scenario.customAdjustments[symbol] / 100
            else:
                adjustment = 0.0
        
        elif scenario.scenarioType in ["RECESSION", "SECTOR_ROTATION", "INTEREST_RATE_SHOCK"]:
            # Get sector for this holding
            sector = "Unknown"
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                sector = info.get('sector', 'Unknown')
            except:
                pass
            
            # Get sector adjustment
            scenario_info = PREDEFINED_SCENARIOS.get(scenario.scenarioType, {})
            sector_adjustments = scenario_info.get("sector_adjustments", {})
            
            if sector in sector_adjustments:
                adjustment = sector_adjustments[sector]
            else:
                # Default adjustment for unknown sectors
                if scenario.scenarioType == "RECESSION":
                    adjustment = -0.20
                else:
                    adjustment = 0.0
        
        # Calculate new price and value
        new_price = current_price * (1 + adjustment)
        new_value = shares * new_price
        total_scenario_value += new_value
        
        scenario_holdings.append({
            "symbol": symbol,
            "shares": shares,
            "currentPrice": current_price,
            "scenarioPrice": round(new_price, 2),
            "currentValue": current_value,
            "scenarioValue": round(new_value, 2),
            "change": round(new_value - current_value, 2),
            "changePercent": round(adjustment * 100, 2)
        })
    
    # Calculate scenario metrics
    total_change = total_scenario_value - current_total_value
    total_change_percent = (total_change / current_total_value * 100) if current_total_value > 0 else 0
    
    # Estimate drawdown (simplified: assume linear relationship)
    current_drawdown = abs(analytics_data.get("analytics", {}).get("maxDrawdown", 0))
    scenario_drawdown = abs(min(0, total_change_percent / 100))
    
    # Estimate volatility change (assume proportional to price change)
    current_volatility = analytics_data.get("analytics", {}).get("volatility", 0)
    volatility_multiplier = 1.5 if abs(total_change_percent) > 20 else 1.2
    scenario_volatility = current_volatility * volatility_multiplier
    
    # Get scenario info
    scenario_info = PREDEFINED_SCENARIOS.get(scenario.scenarioType, {})
    if scenario.scenarioType == "CUSTOM":
        scenario_info = {
            "name": "Custom Scenario",
            "description": "User-defined scenario with custom adjustments"
        }
    
    return {
        "portfolioId": portfolio_id,
        "scenarioType": scenario.scenarioType,
        "scenarioName": scenario_info.get("name", scenario.scenarioType),
        "scenarioDescription": scenario_info.get("description", ""),
        "currentValue": round(current_total_value, 2),
        "scenarioValue": round(total_scenario_value, 2),
        "totalChange": round(total_change, 2),
        "totalChangePercent": round(total_change_percent, 2),
        "holdings": scenario_holdings,
        "metrics": {
            "currentDrawdown": round(current_drawdown * 100, 2),
            "scenarioDrawdown": round(scenario_drawdown * 100, 2),
            "currentVolatility": round(current_volatility * 100, 2),
            "scenarioVolatility": round(scenario_volatility * 100, 2)
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@scenario_router.get("/predefined")
async def get_predefined_scenarios():
    """Get list of predefined scenarios"""
    scenarios = []
    for key, value in PREDEFINED_SCENARIOS.items():
        scenarios.append({
            "type": key,
            "name": value["name"],
            "description": value["description"]
        })
    scenarios.append({
        "type": "CUSTOM",
        "name": "Custom Scenario",
        "description": "Create your own scenario with custom adjustments per holding"
    })
    return {"scenarios": scenarios}

