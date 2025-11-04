"""
Analytics API Router - Portfolio risk analysis endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status
from database import db
from auth import get_current_user_email
from bson import ObjectId
from typing import List, Optional
from analytics import PortfolioAnalytics
from ai_service import AIService
from holdings import get_holdings_collection
from portfolios import get_portfolios_collection
import logging

logger = logging.getLogger(__name__)

analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])

analytics_service = PortfolioAnalytics()
ai_service = AIService()

@analytics_router.get("/portfolio/{portfolio_id}")
async def get_portfolio_analysis(
    portfolio_id: str,
    include_ai_report: bool = False,
    email: str = Depends(get_current_user_email)
):
    """
    Get comprehensive portfolio risk analysis including:
    - Expected Return
    - Volatility
    - Sharpe Ratio
    - Correlation Matrix
    - Sector Breakdown
    - AI Risk Report (optional)
    """
    try:
        # Verify portfolio ownership
        portfolios = get_portfolios_collection()
        portfolio = await portfolios.find_one({
            "_id": ObjectId(portfolio_id),
            "user_email": email
        })
        
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found"
            )
        
        # Get holdings
        holdings_collection = get_holdings_collection()
        holdings_cursor = holdings_collection.find({
            "portfolio_id": portfolio_id,
            "user_email": email
        })
        holdings_list = await holdings_cursor.to_list(length=100)
        
        if not holdings_list:
            return {
                "portfolio_id": portfolio_id,
                "portfolio_name": portfolio.get("name"),
                "message": "No holdings found in portfolio",
                "metrics": {},
                "correlation_matrix": {},
                "sector_breakdown": {},
                "ai_report": None
            }
        
        # Convert holdings to dict format
        holdings = [
            {
                "symbol": h["symbol"],
                "quantity": h.get("quantity", 0),
                "purchase_price": h.get("purchase_price", 0),
                "name": h.get("name", h["symbol"])
            }
            for h in holdings_list
        ]
        
        # Run portfolio analysis
        analysis = await analytics_service.analyze_portfolio(
            holdings, portfolio_id
        )
        
        # Generate AI report if requested
        ai_report = None
        if include_ai_report:
            try:
                ai_report = await ai_service.generate_risk_report(
                    analysis,
                    portfolio.get("name", "Portfolio"),
                    holdings
                )
            except Exception as e:
                logger.error(f"Error generating AI report: {e}")
                ai_report = "AI report generation failed. Please try again later."
        
        return {
            "portfolio_id": portfolio_id,
            "portfolio_name": portfolio.get("name"),
            "holdings_count": len(holdings),
            **analysis,
            "ai_report": ai_report
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in portfolio analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing portfolio: {str(e)}"
        )

@analytics_router.get("/portfolio/{portfolio_id}/metrics")
async def get_portfolio_metrics(
    portfolio_id: str,
    email: str = Depends(get_current_user_email)
):
    """Get quick portfolio metrics (without AI report)"""
    return await get_portfolio_analysis(portfolio_id, include_ai_report=False, email=email)

@analytics_router.get("/portfolio/{portfolio_id}/ai-report")
async def get_ai_risk_report(
    portfolio_id: str,
    email: str = Depends(get_current_user_email)
):
    """Get AI-generated risk report for portfolio"""
    result = await get_portfolio_analysis(portfolio_id, include_ai_report=True, email=email)
    return {
        "portfolio_id": portfolio_id,
        "portfolio_name": result.get("portfolio_name"),
        "ai_report": result.get("ai_report"),
        "metrics": result.get("metrics", {})
    }

