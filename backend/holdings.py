from fastapi import APIRouter, HTTPException, Depends, status
from database import db
from schemas import HoldingSearchResult, HoldingAdd, HoldingResponse
from auth import get_current_user_email
from bson import ObjectId
from typing import List
from datetime import datetime

holdings_router = APIRouter(prefix="/holdings", tags=["Holdings"])

def get_holdings_collection():
    return db["holdings"]

def get_portfolios_collection():
    return db["portfolios"]

def holding_helper(holding) -> dict:
    """Convert MongoDB document to response format"""
    return {
        "id": str(holding["_id"]),
        "portfolio_id": holding["portfolio_id"],
        "symbol": holding["symbol"],
        "name": holding.get("name", ""),
        "quantity": holding.get("quantity", 0.0),
        "purchase_price": holding.get("purchase_price", 0.0),
        "added_at": holding.get("added_at"),
    }

@holdings_router.get("/search", response_model=List[HoldingSearchResult])
async def search_holdings(
    query: str,
    email: str = Depends(get_current_user_email)
):
    """
    Search for stocks/securities by symbol or name.
    Uses a free API for stock search (mock implementation with common stocks).
    """
    if not query or len(query) < 1:
        return []
    
    # Security: Limit query length to prevent DoS
    if len(query) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query too long (max 50 characters)"
        )
    
    query = query.upper().strip()
    
    # Mock stock database - in production, use a real API like Alpha Vantage, Yahoo Finance, etc.
    mock_stocks = [
        {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "type": "Stock"},
        {"symbol": "GOOGL", "name": "Alphabet Inc.", "exchange": "NASDAQ", "type": "Stock"},
        {"symbol": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ", "type": "Stock"},
        {"symbol": "AMZN", "name": "Amazon.com Inc.", "exchange": "NASDAQ", "type": "Stock"},
        {"symbol": "META", "name": "Meta Platforms Inc.", "exchange": "NASDAQ", "type": "Stock"},
        {"symbol": "TSLA", "name": "Tesla Inc.", "exchange": "NASDAQ", "type": "Stock"},
        {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "type": "Stock"},
        {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "exchange": "NYSE", "type": "Stock"},
        {"symbol": "V", "name": "Visa Inc.", "exchange": "NYSE", "type": "Stock"},
        {"symbol": "JNJ", "name": "Johnson & Johnson", "exchange": "NYSE", "type": "Stock"},
        {"symbol": "WMT", "name": "Walmart Inc.", "exchange": "NYSE", "type": "Stock"},
        {"symbol": "PG", "name": "Procter & Gamble Co.", "exchange": "NYSE", "type": "Stock"},
        {"symbol": "MA", "name": "Mastercard Inc.", "exchange": "NYSE", "type": "Stock"},
        {"symbol": "DIS", "name": "The Walt Disney Company", "exchange": "NYSE", "type": "Stock"},
        {"symbol": "NFLX", "name": "Netflix Inc.", "exchange": "NASDAQ", "type": "Stock"},
        {"symbol": "AMD", "name": "Advanced Micro Devices", "exchange": "NASDAQ", "type": "Stock"},
        {"symbol": "INTC", "name": "Intel Corporation", "exchange": "NASDAQ", "type": "Stock"},
        {"symbol": "CSCO", "name": "Cisco Systems Inc.", "exchange": "NASDAQ", "type": "Stock"},
        {"symbol": "PFE", "name": "Pfizer Inc.", "exchange": "NYSE", "type": "Stock"},
        {"symbol": "BAC", "name": "Bank of America Corp.", "exchange": "NYSE", "type": "Stock"},
    ]
    
    # Filter stocks based on query (symbol or name)
    results = []
    query_lower = query.lower()
    
    for stock in mock_stocks:
        if (query_lower in stock["symbol"].lower() or 
            query_lower in stock["name"].lower()):
            results.append(HoldingSearchResult(**stock))
    
    return results[:10]  # Return top 10 results

@holdings_router.post("/", response_model=HoldingResponse, status_code=status.HTTP_201_CREATED)
async def add_holding(
    holding: HoldingAdd,
    email: str = Depends(get_current_user_email)
):
    """
    Add a holding to a portfolio. Verifies portfolio ownership.
    """
    portfolios = get_portfolios_collection()
    holdings = get_holdings_collection()
    
    # Verify portfolio exists and belongs to user
    if not ObjectId.is_valid(holding.portfolio_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portfolio ID"
        )
    
    portfolio = await portfolios.find_one({
        "_id": ObjectId(holding.portfolio_id),
        "user_email": email
    })
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Check if holding already exists
    existing = await holdings.find_one({
        "portfolio_id": holding.portfolio_id,
        "symbol": holding.symbol.upper()
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Holding already exists in this portfolio"
        )
    
    # Get stock name from search (optional)
    stock_name = None
    try:
        search_results = await search_holdings(holding.symbol, email)
        if search_results:
            stock_name = search_results[0].name
    except (HTTPException, Exception) as e:
        # Log error but don't fail the operation
        if isinstance(e, HTTPException):
            raise
        # Silently continue if search fails
        pass
    
    new_holding = {
        "portfolio_id": holding.portfolio_id,
        "symbol": holding.symbol.upper(),
        "name": stock_name or holding.symbol.upper(),
        "quantity": holding.quantity or 0.0,
        "purchase_price": holding.purchase_price or 0.0,
        "user_email": email,
        "added_at": datetime.utcnow().isoformat(),
    }
    
    result = await holdings.insert_one(new_holding)
    created_holding = await holdings.find_one({"_id": result.inserted_id})
    
    # Update portfolio symbols list
    if holding.symbol.upper() not in portfolio.get("symbols", []):
        await portfolios.update_one(
            {"_id": ObjectId(holding.portfolio_id)},
            {"$addToSet": {"symbols": holding.symbol.upper()}}
        )
    
    return holding_helper(created_holding)

@holdings_router.get("/portfolio/{portfolio_id}", response_model=List[HoldingResponse])
async def get_portfolio_holdings(
    portfolio_id: str,
    email: str = Depends(get_current_user_email)
):
    """
    Get all holdings for a specific portfolio.
    """
    holdings = get_holdings_collection()
    portfolios = get_portfolios_collection()
    
    if not ObjectId.is_valid(portfolio_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portfolio ID"
        )
    
    # Verify portfolio ownership
    portfolio = await portfolios.find_one({
        "_id": ObjectId(portfolio_id),
        "user_email": email
    })
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    cursor = holdings.find({"portfolio_id": portfolio_id}).sort("added_at", -1)
    holdings_list = await cursor.to_list(length=100)
    
    return [holding_helper(h) for h in holdings_list]

@holdings_router.delete("/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_holding(
    holding_id: str,
    email: str = Depends(get_current_user_email)
):
    """
    Delete a holding from a portfolio.
    """
    holdings = get_holdings_collection()
    
    if not ObjectId.is_valid(holding_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid holding ID"
        )
    
    holding = await holdings.find_one({
        "_id": ObjectId(holding_id),
        "user_email": email
    })
    
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holding not found"
        )
    
    await holdings.delete_one({"_id": ObjectId(holding_id)})
    
    return None

