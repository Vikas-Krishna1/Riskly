from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field
from database import get_alert_collection, get_portfolio_collection
from auth import get_current_user
import yfinance as yf
import asyncio

alert_router = APIRouter(prefix="/alerts", tags=["Alerts"])

class AlertCreate(BaseModel):
    portfolioId: str
    alertType: str = Field(..., description="PRICE, REBALANCING, RISK_METRIC, PORTFOLIO_VALUE")
    symbol: Optional[str] = None
    threshold: float = Field(..., description="Threshold value for the alert")
    condition: str = Field(..., description="ABOVE, BELOW, EQUALS for price/value alerts")
    riskMetric: Optional[str] = Field(None, description="For RISK_METRIC alerts: VAR, DRAWDOWN, VOLATILITY, etc.")
    enabled: bool = True
    notes: Optional[str] = None

class AlertUpdate(BaseModel):
    threshold: Optional[float] = None
    condition: Optional[str] = None
    enabled: Optional[bool] = None
    notes: Optional[str] = None

class AlertResponse(BaseModel):
    id: str
    portfolioId: str
    alertType: str
    symbol: Optional[str] = None
    threshold: float
    condition: str
    riskMetric: Optional[str] = None
    enabled: bool
    notes: Optional[str] = None
    triggered: bool
    triggeredAt: Optional[datetime] = None
    createdAt: datetime
    lastChecked: Optional[datetime] = None

@alert_router.post("")
async def create_alert(
    alert: AlertCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new alert for a portfolio"""
    portfolios = get_portfolio_collection()
    alerts = get_alert_collection()
    
    # Verify portfolio exists and user has access
    portfolio = await portfolios.find_one({"_id": ObjectId(alert.portfolioId)})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")
    
    # Validate alert type
    valid_types = ["PRICE", "REBALANCING", "RISK_METRIC", "PORTFOLIO_VALUE"]
    if alert.alertType not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid alert type. Must be one of: {', '.join(valid_types)}")
    
    # Validate condition
    if alert.condition not in ["ABOVE", "BELOW", "EQUALS"]:
        raise HTTPException(status_code=400, detail="Invalid condition. Must be ABOVE, BELOW, or EQUALS")
    
    new_alert = {
        "portfolioId": ObjectId(alert.portfolioId),
        "alertType": alert.alertType,
        "symbol": alert.symbol,
        "threshold": alert.threshold,
        "condition": alert.condition,
        "riskMetric": alert.riskMetric,
        "enabled": alert.enabled,
        "notes": alert.notes,
        "triggered": False,
        "triggeredAt": None,
        "createdAt": datetime.utcnow(),
        "lastChecked": None
    }
    
    result = await alerts.insert_one(new_alert)
    
    return {
        "id": str(result.inserted_id),
        "portfolioId": alert.portfolioId,
        "alertType": alert.alertType,
        "symbol": alert.symbol,
        "threshold": alert.threshold,
        "condition": alert.condition,
        "riskMetric": alert.riskMetric,
        "enabled": alert.enabled,
        "notes": alert.notes,
        "triggered": False,
        "triggeredAt": None,
        "createdAt": new_alert["createdAt"].isoformat(),
        "lastChecked": None
    }

@alert_router.get("/portfolio/{portfolio_id}")
async def get_portfolio_alerts(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user),
    enabled_only: bool = Query(False, description="Only return enabled alerts")
):
    """Get all alerts for a portfolio"""
    portfolios = get_portfolio_collection()
    alerts = get_alert_collection()
    
    # Verify portfolio exists and user has access
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")
    
    query = {"portfolioId": ObjectId(portfolio_id)}
    if enabled_only:
        query["enabled"] = True
    
    alert_list = await alerts.find(query).sort("createdAt", -1).to_list(length=100)
    
    result = []
    for alert in alert_list:
        result.append({
            "id": str(alert["_id"]),
            "portfolioId": str(alert["portfolioId"]),
            "alertType": alert.get("alertType"),
            "symbol": alert.get("symbol"),
            "threshold": alert.get("threshold"),
            "condition": alert.get("condition"),
            "riskMetric": alert.get("riskMetric"),
            "enabled": alert.get("enabled", True),
            "notes": alert.get("notes"),
            "triggered": alert.get("triggered", False),
            "triggeredAt": alert.get("triggeredAt").isoformat() if alert.get("triggeredAt") else None,
            "createdAt": alert.get("createdAt").isoformat() if isinstance(alert.get("createdAt"), datetime) else alert.get("createdAt"),
            "lastChecked": alert.get("lastChecked").isoformat() if alert.get("lastChecked") else None
        })
    
    return result

@alert_router.get("/user/active")
async def get_user_active_alerts(
    current_user: dict = Depends(get_current_user)
):
    """Get all active (triggered and enabled) alerts for the current user"""
    portfolios = get_portfolio_collection()
    alerts = get_alert_collection()
    
    # Get all user's portfolios
    user_portfolios = await portfolios.find(
        {"userId": ObjectId(current_user["id"])}
    ).to_list(length=1000)
    
    portfolio_ids = [p["_id"] for p in user_portfolios]
    
    if not portfolio_ids:
        return []
    
    # Get triggered alerts
    alert_list = await alerts.find({
        "portfolioId": {"$in": portfolio_ids},
        "enabled": True,
        "triggered": True
    }).sort("triggeredAt", -1).to_list(length=100)
    
    result = []
    for alert in alert_list:
        portfolio = next((p for p in user_portfolios if p["_id"] == alert["portfolioId"]), None)
        result.append({
            "id": str(alert["_id"]),
            "portfolioId": str(alert["portfolioId"]),
            "portfolioName": portfolio.get("name", "Portfolio") if portfolio else "Unknown",
            "alertType": alert.get("alertType"),
            "symbol": alert.get("symbol"),
            "threshold": alert.get("threshold"),
            "condition": alert.get("condition"),
            "riskMetric": alert.get("riskMetric"),
            "notes": alert.get("notes"),
            "triggeredAt": alert.get("triggeredAt").isoformat() if alert.get("triggeredAt") else None,
            "createdAt": alert.get("createdAt").isoformat() if isinstance(alert.get("createdAt"), datetime) else alert.get("createdAt")
        })
    
    return result

@alert_router.put("/{alert_id}")
async def update_alert(
    alert_id: str,
    alert_update: AlertUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing alert"""
    alerts = get_alert_collection()
    portfolios = get_portfolio_collection()
    
    alert = await alerts.find_one({"_id": ObjectId(alert_id)})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Verify portfolio ownership
    portfolio = await portfolios.find_one({"_id": alert["portfolioId"]})
    if not portfolio or str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this alert")
    
    update_data = {}
    if alert_update.threshold is not None:
        update_data["threshold"] = alert_update.threshold
    if alert_update.condition is not None:
        update_data["condition"] = alert_update.condition
    if alert_update.enabled is not None:
        update_data["enabled"] = alert_update.enabled
        # Reset triggered status if disabling
        if not alert_update.enabled:
            update_data["triggered"] = False
            update_data["triggeredAt"] = None
    if alert_update.notes is not None:
        update_data["notes"] = alert_update.notes
    
    await alerts.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": update_data}
    )
    
    updated_alert = await alerts.find_one({"_id": ObjectId(alert_id)})
    
    return {
        "id": str(updated_alert["_id"]),
        "portfolioId": str(updated_alert["portfolioId"]),
        "alertType": updated_alert.get("alertType"),
        "symbol": updated_alert.get("symbol"),
        "threshold": updated_alert.get("threshold"),
        "condition": updated_alert.get("condition"),
        "riskMetric": updated_alert.get("riskMetric"),
        "enabled": updated_alert.get("enabled", True),
        "notes": updated_alert.get("notes"),
        "triggered": updated_alert.get("triggered", False),
        "triggeredAt": updated_alert.get("triggeredAt").isoformat() if updated_alert.get("triggeredAt") else None,
        "createdAt": updated_alert.get("createdAt").isoformat() if isinstance(updated_alert.get("createdAt"), datetime) else updated_alert.get("createdAt"),
        "lastChecked": updated_alert.get("lastChecked").isoformat() if updated_alert.get("lastChecked") else None
    }

@alert_router.delete("/{alert_id}")
async def delete_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an alert"""
    alerts = get_alert_collection()
    portfolios = get_portfolio_collection()
    
    alert = await alerts.find_one({"_id": ObjectId(alert_id)})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Verify portfolio ownership
    portfolio = await portfolios.find_one({"_id": alert["portfolioId"]})
    if not portfolio or str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this alert")
    
    await alerts.delete_one({"_id": ObjectId(alert_id)})
    
    return {"message": "Alert deleted successfully"}

@alert_router.post("/check/{portfolio_id}")
async def check_alerts(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Manually trigger alert checking for a portfolio"""
    from portfolios.analytics import get_portfolio_analytics
    
    portfolios = get_portfolio_collection()
    alerts = get_alert_collection()
    
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")
    
    # Get enabled alerts for this portfolio
    alert_list = await alerts.find({
        "portfolioId": ObjectId(portfolio_id),
        "enabled": True
    }).to_list(length=100)
    
    if not alert_list:
        return {"message": "No enabled alerts to check", "triggered": []}
    
    triggered_alerts = []
    
    # Get portfolio analytics
    try:
        analytics_data = await get_portfolio_analytics(
            portfolio_id=portfolio_id,
            current_user=current_user
        )
    except:
        analytics_data = None
    
    for alert in alert_list:
        try:
            triggered = False
            
            if alert["alertType"] == "PRICE" and alert.get("symbol"):
                # Check current price
                ticker = yf.Ticker(alert["symbol"])
                current_data = ticker.history(period="1d")
                if not current_data.empty:
                    current_price = float(current_data["Close"].iloc[-1])
                    threshold = alert["threshold"]
                    condition = alert["condition"]
                    
                    if condition == "ABOVE" and current_price > threshold:
                        triggered = True
                    elif condition == "BELOW" and current_price < threshold:
                        triggered = True
                    elif condition == "EQUALS" and abs(current_price - threshold) < 0.01:
                        triggered = True
            
            elif alert["alertType"] == "PORTFOLIO_VALUE" and analytics_data:
                current_value = analytics_data.get("totalPortfolioValue", 0)
                threshold = alert["threshold"]
                condition = alert["condition"]
                
                if condition == "ABOVE" and current_value > threshold:
                    triggered = True
                elif condition == "BELOW" and current_value < threshold:
                    triggered = True
                elif condition == "EQUALS" and abs(current_value - threshold) < 1:
                    triggered = True
            
            elif alert["alertType"] == "RISK_METRIC" and analytics_data:
                risk_metric = alert.get("riskMetric")
                analytics = analytics_data.get("analytics", {})
                threshold = alert["threshold"]
                condition = alert["condition"]
                
                current_value = None
                if risk_metric == "VAR":
                    current_value = abs(analytics.get("valueAtRisk", 0))
                elif risk_metric == "DRAWDOWN":
                    current_value = abs(analytics.get("maxDrawdown", 0))
                elif risk_metric == "VOLATILITY":
                    current_value = analytics.get("volatility", 0)
                
                if current_value is not None:
                    if condition == "ABOVE" and current_value > threshold:
                        triggered = True
                    elif condition == "BELOW" and current_value < threshold:
                        triggered = True
                    elif condition == "EQUALS" and abs(current_value - threshold) < 0.001:
                        triggered = True
            
            elif alert["alertType"] == "REBALANCING" and analytics_data:
                # Check if portfolio needs rebalancing (simplified: check concentration)
                concentration = analytics_data.get("analytics", {}).get("concentration", 0)
                threshold = alert["threshold"]
                
                if concentration > threshold:
                    triggered = True
            
            if triggered and not alert.get("triggered", False):
                # Mark alert as triggered
                await alerts.update_one(
                    {"_id": alert["_id"]},
                    {
                        "$set": {
                            "triggered": True,
                            "triggeredAt": datetime.utcnow(),
                            "lastChecked": datetime.utcnow()
                        }
                    }
                )
                triggered_alerts.append({
                    "id": str(alert["_id"]),
                    "alertType": alert["alertType"],
                    "symbol": alert.get("symbol"),
                    "threshold": alert["threshold"]
                })
            else:
                # Update last checked time
                await alerts.update_one(
                    {"_id": alert["_id"]},
                    {"$set": {"lastChecked": datetime.utcnow()}}
                )
        
        except Exception as e:
            print(f"Error checking alert {alert.get('_id')}: {e}")
            continue
    
    return {
        "message": f"Checked {len(alert_list)} alerts",
        "triggered": triggered_alerts,
        "triggeredCount": len(triggered_alerts)
    }

