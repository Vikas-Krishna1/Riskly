from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
from database import get_transaction_collection, get_portfolio_collection
from schemas import TransactionResponse
from auth import get_current_user

transaction_router = APIRouter(prefix="/transactions", tags=["Transactions"])

async def log_transaction(
    portfolio_id: str,
    holding_id: str,
    transaction_type: str,
    symbol: str,
    shares: float,
    price: float,
    purchase_date: datetime,
    previous_shares: Optional[float] = None,
    previous_price: Optional[float] = None,
    previous_symbol: Optional[str] = None,
    notes: Optional[str] = None
):
    """Helper function to log a transaction"""
    transactions = get_transaction_collection()
    
    transaction = {
        "portfolioId": ObjectId(portfolio_id),
        "holdingId": holding_id,
        "transactionType": transaction_type,
        "symbol": symbol,
        "shares": shares,
        "price": price,
        "purchaseDate": purchase_date,
        "previousShares": previous_shares,
        "previousPrice": previous_price,
        "previousSymbol": previous_symbol,
        "timestamp": datetime.utcnow(),
        "notes": notes
    }
    
    await transactions.insert_one(transaction)
    return transaction

@transaction_router.get("/portfolio/{portfolio_id}")
async def get_transactions(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user),
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type (BUY, SELL, EDIT, DELETE)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get transaction history for a portfolio with optional filters"""
    portfolios = get_portfolio_collection()
    transactions = get_transaction_collection()
    
    # Verify portfolio exists and user has access
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")
    
    # Build query
    query = {"portfolioId": ObjectId(portfolio_id)}
    
    if symbol:
        query["symbol"] = symbol.upper()
    
    if transaction_type:
        query["transactionType"] = transaction_type.upper()
    
    if start_date or end_date:
        query["timestamp"] = {}
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query["timestamp"]["$gte"] = start_dt
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            # Include the entire end date
            end_dt = end_dt.replace(hour=23, minute=59, second=59)
            query["timestamp"]["$lte"] = end_dt
    
    # Fetch transactions
    transaction_list = await transactions.find(query).sort("timestamp", -1).to_list(length=1000)
    
    # Convert ObjectIds to strings
    result = []
    for tx in transaction_list:
        tx["id"] = str(tx["_id"])
        tx["portfolioId"] = str(tx["portfolioId"])
        if isinstance(tx.get("purchaseDate"), datetime):
            tx["purchaseDate"] = tx["purchaseDate"]
        if isinstance(tx.get("timestamp"), datetime):
            tx["timestamp"] = tx["timestamp"]
        del tx["_id"]
        result.append(tx)
    
    return result

