import yfinance as yf
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List
from database import get_portfolio_collection
from schemas import PortfolioCreate, PortfolioResponse, PortfolioUpdate, HoldingAdd
from auth import get_current_user

portfolio_router = APIRouter(prefix="/portfolios", tags=["Portfolios"])

# Create a new portfolio
# Route becomes: POST /portfolios
@portfolio_router.post("")
async def create_portfolio(
    portfolio: PortfolioCreate,
    current_user: dict = Depends(get_current_user)
):
    portfolios = get_portfolio_collection()
    
    new_portfolio = {
        "userId": ObjectId(current_user["id"]),
        "name": portfolio.name,
        "description": portfolio.description,
        "holdings": [],
        "createdAt": datetime.utcnow()
    }
    
    result = await portfolios.insert_one(new_portfolio)
    
    return {
        "message": "Portfolio created successfully",
        "portfolioId": str(result.inserted_id),
        "portfolio": {
            "id": str(result.inserted_id),
            "userId": current_user["id"],
            "name": portfolio.name,
            "description": portfolio.description,
            "holdings": [],
            "createdAt": new_portfolio["createdAt"]
        }
    }

# Get all portfolios for a specific user
# Route becomes: GET /portfolios/user/{user_id}
@portfolio_router.get("/user/{user_id}")  # ← Changed this line
async def get_user_portfolios(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Security: only allow users to see their own portfolios
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own portfolios")
    
    portfolios = get_portfolio_collection()
    
    user_portfolios = await portfolios.find(
        {"userId": ObjectId(user_id)}
    ).sort("createdAt", -1).to_list(length=100)
    
    # Convert ObjectIds to strings for JSON
    for portfolio in user_portfolios:
        portfolio["id"] = str(portfolio["_id"])
        portfolio["userId"] = str(portfolio["userId"])
        del portfolio["_id"]
    
    return user_portfolios

# Get a single portfolio by ID
# Route becomes: GET /portfolios/{portfolio_id}
@portfolio_router.get("/{portfolio_id}")
async def get_portfolio(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    portfolios = get_portfolio_collection()
    
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Security: verify ownership
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")
    
    portfolio["id"] = str(portfolio["_id"])
    portfolio["userId"] = str(portfolio["userId"])
    del portfolio["_id"]
    
    return portfolio

# Update a portfolio
# Route becomes: PUT /portfolios/{portfolio_id}
@portfolio_router.put("/{portfolio_id}")
async def update_portfolio(
    portfolio_id: str,
    portfolio_update: PortfolioUpdate,
    current_user: dict = Depends(get_current_user)
):
    portfolios = get_portfolio_collection()
    
    existing = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    
    if not existing:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(existing["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Build update dict with only provided fields
    update_data = {}
    if portfolio_update.name is not None:
        update_data["name"] = portfolio_update.name
    if portfolio_update.description is not None:
        update_data["description"] = portfolio_update.description
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updatedAt"] = datetime.utcnow()
    
    await portfolios.update_one(
        {"_id": ObjectId(portfolio_id)},
        {"$set": update_data}
    )
    
    return {"message": "Portfolio updated successfully"}

# Delete a portfolio
# Route becomes: DELETE /portfolios/{portfolio_id}
@portfolio_router.delete("/{portfolio_id}")
async def delete_portfolio(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    portfolios = get_portfolio_collection()
    
    existing = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    
    if not existing:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    if str(existing["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    await portfolios.delete_one({"_id": ObjectId(portfolio_id)})
    
    return {"message": "Portfolio deleted successfully"}

@portfolio_router.post("/{portfolio_id}/holdings")
async def add_holding(
    portfolio_id: str,
    holding_data: HoldingAdd,
    current_user: dict = Depends(get_current_user)
):
    portfolios = get_portfolio_collection()

    # Find the portfolio by ID
    portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Security: verify ownership
    if str(portfolio["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have access to this portfolio")

    # Determine the purchase date
    if holding_data.purchaseDate:
        purchase_date = datetime.strptime(holding_data.purchaseDate, "%Y-%m-%d")
    else:
        purchase_date = datetime.utcnow()

    # Fetch historical price from yfinance for the specified date
    try:
        ticker = yf.Ticker(holding_data.symbol)
        # Fetch data for a small window to ensure we get a valid price
        history = ticker.history(start=purchase_date, end=purchase_date + timedelta(days=1))
        if history.empty:
            raise HTTPException(status_code=400, detail=f"Could not find symbol or price for date: {holding_data.symbol}, {holding_data.purchaseDate}")
        
        price_on_date = history['Close'].iloc[-1]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock data: {e}")

    # Build the new holding entry
    newHolding = {
        "id": str(ObjectId()),
        "symbol": holding_data.symbol,
        "shares": holding_data.shares,
        "purchasePrice": price_on_date,
        "purchaseDate": purchase_date,
    }

    # Push new holding into holdings array
    await portfolios.update_one(
        {"_id": ObjectId(portfolio_id)},
        {"$push": {"holdings": newHolding}}
    )

    return {
        "message": "Holding successfully created!",
        "added": newHolding
    }

    
