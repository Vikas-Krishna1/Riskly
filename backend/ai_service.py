"""
AI Service - Generates natural-language risk reports using OpenAI
"""
import os
from openai import OpenAI
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class AIService:
    """Service for generating AI-powered risk analysis reports"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not found. AI reports will not be available.")
            self.client = None
        else:
            self.client = OpenAI(api_key=api_key)
    
    async def generate_risk_report(
        self,
        portfolio_analysis: Dict,
        portfolio_name: str,
        holdings: list
    ) -> str:
        """
        Generate a natural-language risk analysis report
        
        Args:
            portfolio_analysis: Results from PortfolioAnalytics.analyze_portfolio()
            portfolio_name: Name of the portfolio
            holdings: List of holdings in the portfolio
        
        Returns:
            Natural-language risk report
        """
        if not self.client:
            return self._generate_fallback_report(portfolio_analysis, portfolio_name)
        
        try:
            # Prepare context for AI
            metrics = portfolio_analysis.get("metrics", {})
            sector_breakdown = portfolio_analysis.get("sector_breakdown", {})
            correlation_matrix = portfolio_analysis.get("correlation_matrix", {})
            
            # Build prompt
            prompt = f"""You are a professional portfolio risk analyst. Analyze the following portfolio and provide a comprehensive, easy-to-understand risk assessment report.

Portfolio Name: {portfolio_name}

Portfolio Metrics:
- Expected Annual Return: {metrics.get('expected_return', 0)}%
- Volatility (Risk): {metrics.get('volatility', 0)}%
- Sharpe Ratio: {metrics.get('sharpe_ratio', 0)}
- Current Portfolio Value: ${portfolio_analysis.get('current_value', 0):,.2f}
- Total Return: ${portfolio_analysis.get('total_return', 0):,.2f}

Holdings ({len(holdings)} stocks):
{self._format_holdings(holdings)}

Sector Allocation:
{self._format_sector_breakdown(sector_breakdown)}

Please provide a comprehensive risk analysis report that includes:
1. Overall risk assessment (Low/Medium/High)
2. Key strengths of the portfolio
3. Main risk factors and concerns
4. Diversification analysis
5. Specific recommendations for risk management
6. Outlook and suggestions

Write in a clear, professional but accessible tone. Target audience: everyday investors who want to understand their portfolio risk.

Keep the report concise (300-400 words) but comprehensive."""

            response = self.client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4"),
                messages=[
                    {"role": "system", "content": "You are a professional financial risk analyst with expertise in portfolio management and risk assessment."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating AI risk report: {e}")
            return self._generate_fallback_report(portfolio_analysis, portfolio_name)
    
    def _format_holdings(self, holdings: list) -> str:
        """Format holdings for AI prompt"""
        formatted = []
        for holding in holdings:
            formatted.append(
                f"- {holding.get('symbol', 'N/A')}: {holding.get('quantity', 0)} shares @ ${holding.get('purchase_price', 0):.2f}"
            )
        return "\n".join(formatted)
    
    def _format_sector_breakdown(self, sector_breakdown: Dict) -> str:
        """Format sector breakdown for AI prompt"""
        formatted = []
        for sector, data in sector_breakdown.items():
            formatted.append(f"- {sector}: {data.get('weight', 0)}% of portfolio")
        return "\n".join(formatted) if formatted else "No sector data available"
    
    def _generate_fallback_report(
        self,
        portfolio_analysis: Dict,
        portfolio_name: str
    ) -> str:
        """Generate a basic report when AI is not available"""
        metrics = portfolio_analysis.get("metrics", {})
        
        return f"""
Portfolio Risk Analysis Report: {portfolio_name}

OVERVIEW
This portfolio analysis is based on current market data and historical performance.

KEY METRICS
• Expected Return: {metrics.get('expected_return', 0)}% annually
• Volatility: {metrics.get('volatility', 0)}% (risk level)
• Sharpe Ratio: {metrics.get('sharpe_ratio', 0)} (risk-adjusted return)

RISK ASSESSMENT
Based on the volatility metric, this portfolio shows {'moderate' if metrics.get('volatility', 0) < 20 else 'high'} risk levels.

RECOMMENDATIONS
1. Monitor portfolio diversification across sectors
2. Review individual stock performance regularly
3. Consider rebalancing if allocations shift significantly

Note: For detailed AI-powered analysis, please configure OPENAI_API_KEY in your environment variables.
"""

