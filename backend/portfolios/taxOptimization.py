from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List, Optional
from database import get_portfolio_collection, get_transaction_collection
from auth import get_current_user
from portfolios.analytics import get_portfolio_analytics

tax_router = APIRouter(prefix="/tax-optimization", tags=["Tax Optimization"])

@tax_router.get("/{portfolio_id}/suggestions")
async def get_tax_optimization_suggestions(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user),
    tax_rate: float = 0.25  # Default 25% capital gains tax rate
):
    """
    Get tax-loss harvesting suggestions and tax optimization recommendations.
    """
    portfolios = get_portfolio_collection()
    transactions = get_transaction_collection()
    
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
    
    # Get transaction history to check for wash-sale rule violations
    transaction_list = await transactions.find({
        "portfolioId": ObjectId(portfolio_id)
    }).sort("timestamp", -1).to_list(length=1000)
    
    # Identify tax-loss harvesting opportunities
    tax_loss_opportunities = []
    total_potential_savings = 0.0
    
    for holding in holdings:
        gain_loss = holding.get("gainLoss", 0)
        current_value = holding.get("currentValue", 0)
        purchase_value = holding.get("purchaseValue", 0)
        symbol = holding.get("symbol")
        purchase_date = None
        
        # Try to get purchase date from holding or transactions
        if "purchaseDate" in holding:
            try:
                purchase_date = datetime.fromisoformat(str(holding["purchaseDate"]))
            except:
                pass
        
        # Check if holding has a loss
        if gain_loss < 0:
            loss_amount = abs(gain_loss)
            potential_tax_savings = loss_amount * tax_rate
            
            # Check for wash-sale rule (30 days before/after)
            wash_sale_warning = False
            if purchase_date:
                thirty_days_ago = datetime.utcnow() - timedelta(days=30)
                thirty_days_from_now = datetime.utcnow() + timedelta(days=30)
                
                # Check if there were recent transactions for this symbol
                for tx in transaction_list:
                    if tx.get("symbol") == symbol:
                        tx_date = tx.get("timestamp")
                        if isinstance(tx_date, datetime):
                            if thirty_days_ago <= tx_date <= thirty_days_from_now:
                                wash_sale_warning = True
                                break
            
            # Determine if it's long-term or short-term
            is_long_term = False
            if purchase_date:
                days_held = (datetime.utcnow() - purchase_date).days
                is_long_term = days_held >= 365
            
            tax_loss_opportunities.append({
                "symbol": symbol,
                "currentValue": current_value,
                "purchaseValue": purchase_value,
                "lossAmount": round(loss_amount, 2),
                "lossPercent": round((loss_amount / purchase_value * 100) if purchase_value > 0 else 0, 2),
                "potentialTaxSavings": round(potential_tax_savings, 2),
                "isLongTerm": is_long_term,
                "washSaleWarning": wash_sale_warning,
                "daysHeld": (datetime.utcnow() - purchase_date).days if purchase_date else None
            })
            
            total_potential_savings += potential_tax_savings
    
    # Sort by potential tax savings (highest first)
    tax_loss_opportunities.sort(key=lambda x: x["potentialTaxSavings"], reverse=True)
    
    # Calculate total unrealized gains/losses
    total_unrealized_gains = sum(h.get("gainLoss", 0) for h in holdings if h.get("gainLoss", 0) > 0)
    total_unrealized_losses = sum(abs(h.get("gainLoss", 0)) for h in holdings if h.get("gainLoss", 0) < 0)
    net_unrealized = total_unrealized_gains + total_unrealized_losses
    
    # Generate recommendations
    recommendations = []
    
    if len(tax_loss_opportunities) > 0:
        recommendations.append({
            "priority": "high",
            "category": "tax_loss_harvesting",
            "action": f"Consider harvesting losses from {len(tax_loss_opportunities)} holding(s) to offset gains",
            "potentialSavings": round(total_potential_savings, 2),
            "rationale": f"Tax-loss harvesting could save up to ${total_potential_savings:.2f} in taxes"
        })
    
    if total_unrealized_gains > 0 and total_unrealized_losses > 0:
        net_offset = min(total_unrealized_gains, total_unrealized_losses)
        offset_savings = net_offset * tax_rate
        recommendations.append({
            "priority": "medium",
            "category": "gain_loss_offset",
            "action": f"Offset ${net_offset:.2f} in gains with losses",
            "potentialSavings": round(offset_savings, 2),
            "rationale": "Offsetting gains with losses can reduce your tax liability"
        })
    
    # Check for long-term vs short-term holdings
    long_term_holdings = []
    short_term_holdings = []
    
    for holding in holdings:
        symbol = holding.get("symbol")
        purchase_date = None
        if "purchaseDate" in holding:
            try:
                purchase_date = datetime.fromisoformat(str(holding["purchaseDate"]))
            except:
                pass
        
        if purchase_date:
            days_held = (datetime.utcnow() - purchase_date).days
            if days_held >= 365:
                long_term_holdings.append(symbol)
            else:
                short_term_holdings.append(symbol)
    
    if len(short_term_holdings) > 0:
        recommendations.append({
            "priority": "low",
            "category": "holding_period",
            "action": f"Consider holding {len(short_term_holdings)} position(s) for 1+ year for long-term capital gains rates",
            "potentialSavings": None,
            "rationale": "Long-term capital gains are typically taxed at lower rates than short-term gains"
        })
    
    if not recommendations:
        recommendations.append({
            "priority": "low",
            "category": "general",
            "action": "No immediate tax optimization opportunities identified",
            "potentialSavings": 0,
            "rationale": "Portfolio shows no significant tax-loss harvesting opportunities at this time"
        })
    
    return {
        "portfolioId": portfolio_id,
        "taxRate": tax_rate,
        "totalUnrealizedGains": round(total_unrealized_gains, 2),
        "totalUnrealizedLosses": round(total_unrealized_losses, 2),
        "netUnrealized": round(net_unrealized, 2),
        "taxLossOpportunities": tax_loss_opportunities,
        "totalPotentialSavings": round(total_potential_savings, 2),
        "recommendations": recommendations,
        "longTermHoldings": len(long_term_holdings),
        "shortTermHoldings": len(short_term_holdings)
    }

