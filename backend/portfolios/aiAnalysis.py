from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from database import get_portfolio_collection
from auth import get_current_user

load_dotenv()

ai_analysis_router = APIRouter(prefix="/ai-analysis", tags=["AI Analysis"])

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("Warning: OPENAI_API_KEY not found in environment variables")

client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

@ai_analysis_router.get("/{portfolio_id}")
async def get_ai_portfolio_analysis(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get AI-powered analysis and advice for a portfolio.
    Fetches portfolio analytics and uses GPT to provide personalized investment advice.
    """
    if not client:
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
        )
    
    portfolios = get_portfolio_collection()
    
    # Verify portfolio exists and user has access
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")
    
    # Get portfolio analytics by calling the analytics function directly
    try:
        from portfolios.analytics import get_portfolio_analytics
        
        # Call the analytics function directly, passing current_user as keyword argument
        # This works because Depends() is only used when FastAPI calls it as a route handler
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
    
    # Check if analytics has holdings
    if "message" in analytics_data:
        return {
            "analysis": {
                "overallAssessment": "This portfolio has no holdings to analyze. Please add holdings before requesting AI analysis.",
                "strengths": [],
                "weaknesses": [],
                "recommendations": [],
                "riskConsiderations": []
            }
        }
    
    # Prepare data for GPT
    portfolio_name = analytics_data.get("portfolioName", "Portfolio")
    total_value = analytics_data.get("totalPortfolioValue", 0)
    analytics = analytics_data.get("analytics", {})
    holdings = analytics_data.get("holdings", [])
    best_holding = analytics_data.get("bestHolding")
    worst_holding = analytics_data.get("worstHolding")
    
    # Format holdings summary
    holdings_summary = "\n".join([
        f"- {h['symbol']}: {h['shares']} shares, Current Value: ${h['currentValue']:.2f}, "
        f"Gain/Loss: ${h['gainLoss']:.2f} ({(h['gainLoss']/h['purchaseValue']*100) if h['purchaseValue'] > 0 else 0:.2f}%)"
        for h in holdings
    ])
    
    # Create prompt for GPT
    prompt = f"""You are an expert financial advisor analyzing a portfolio. Provide actionable, professional investment advice based on the following portfolio data:

PORTFOLIO: {portfolio_name}
Total Portfolio Value: ${total_value:,.2f}

KEY METRICS:
- Total Return: {analytics.get('totalReturn', 0)*100:.2f}%
- Annualized Return: {analytics.get('annualizedReturn', 0)*100:.2f}%
- Sharpe Ratio: {analytics.get('sharpeRatio', 0):.3f}
- Sortino Ratio: {analytics.get('sortinoRatio', 0):.3f}
- Max Drawdown: {analytics.get('maxDrawdown', 0)*100:.2f}%
- Volatility: {analytics.get('volatility', 0)*100:.2f}%
- Beta: {analytics.get('beta', 0):.3f}
- Alpha: {analytics.get('alpha', 0)*100:.2f}%
- Win Rate: {analytics.get('winRate', 0):.1f}%
- Portfolio Concentration: {analytics.get('concentration', 0)*100:.1f}%
- Value at Risk (95%): {analytics.get('valueAtRisk', 0)*100:.2f}%

HOLDINGS:
{holdings_summary}

{f"BEST PERFORMER: {best_holding['symbol']} with ${best_holding['gainLoss']:,.2f} gain ({best_holding['gainLossPercent']:.2f}%)" if best_holding else ""}
{f"WORST PERFORMER: {worst_holding['symbol']} with ${worst_holding['gainLoss']:,.2f} loss ({worst_holding['gainLossPercent']:.2f}%)" if worst_holding else ""}

Please provide:
1. A brief overall assessment of the portfolio's performance and risk profile
2. Specific strengths and weaknesses identified
3. Actionable recommendations (3-5 specific, prioritized recommendations)
4. Risk considerations and suggestions for improvement

Format your response as JSON with the following structure:
{{
    "overallAssessment": "Brief summary of portfolio performance",
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "recommendations": [
        {{
            "priority": "high/medium/low",
            "category": "diversification/risk management/performance optimization/etc",
            "action": "Specific actionable recommendation",
            "rationale": "Why this recommendation matters"
        }}
    ],
    "riskConsiderations": ["risk consideration 1", "risk consideration 2", ...]
}}

Be concise, professional, and data-driven. Focus on actionable insights."""
    
    try:
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Using gpt-4o-mini for cost efficiency, can be changed to gpt-4 if needed
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert financial advisor specializing in portfolio analysis and investment strategy. Provide clear, actionable, and professional advice based on quantitative portfolio metrics."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1500
        )
        
        # Extract the response
        ai_response = response.choices[0].message.content
        
        # Try to parse as JSON, if it fails return as plain text
        try:
            analysis_data = json.loads(ai_response)
            return {
                "portfolioName": portfolio_name,
                "analysis": analysis_data
            }
        except json.JSONDecodeError:
            # If not valid JSON, try to extract JSON from markdown code blocks
            try:
                # Try to find JSON in code blocks
                if "```json" in ai_response:
                    json_start = ai_response.find("```json") + 7
                    json_end = ai_response.find("```", json_start)
                    json_str = ai_response[json_start:json_end].strip()
                    analysis_data = json.loads(json_str)
                    return {
                        "portfolioName": portfolio_name,
                        "analysis": analysis_data
                    }
                elif "```" in ai_response:
                    json_start = ai_response.find("```") + 3
                    json_end = ai_response.find("```", json_start)
                    json_str = ai_response[json_start:json_end].strip()
                    analysis_data = json.loads(json_str)
                    return {
                        "portfolioName": portfolio_name,
                        "analysis": analysis_data
                    }
            except:
                pass
            
            # If all JSON parsing fails, return as structured text
            return {
                "portfolioName": portfolio_name,
                "analysis": {
                    "overallAssessment": ai_response,
                    "strengths": [],
                    "weaknesses": [],
                    "recommendations": [],
                    "riskConsiderations": []
                }
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate AI analysis: {str(e)}"
        )

