import yfinance as yf
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List
from database import get_portfolio_collection
from schemas import PortfolioCreate, PortfolioResponse, PortfolioUpdate, HoldingAdd, HoldingUpdate
from auth import get_current_user
from portfolios.transactions import log_transaction

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

    # Log transaction
    await log_transaction(
        portfolio_id=portfolio_id,
        holding_id=newHolding["id"],
        transaction_type="BUY",
        symbol=newHolding["symbol"],
        shares=newHolding["shares"],
        price=newHolding["purchasePrice"],
        purchase_date=newHolding["purchaseDate"],
        notes=f"Added {newHolding['shares']} shares of {newHolding['symbol']}"
    )

    return {
        "message": "Holding successfully created!",
        "added": newHolding
    }

@portfolio_router.put("/{portfolio_id}/holdings/{holding_id}")
async def update_holding(
    portfolio_id: str,
    holding_id: str,
    holding_update: HoldingUpdate,
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

    # Find the holding in the portfolio
    holdings = portfolio.get("holdings", [])
    holding_index = None
    holding = None
    
    for i, h in enumerate(holdings):
        if h.get("id") == holding_id:
            holding_index = i
            holding = h
            break
    
    if holding_index is None or holding is None:
        raise HTTPException(status_code=404, detail="Holding not found")

    # Build update data
    updated_holding = holding.copy()
    
    # Determine the purchase date to use (either updated or existing)
    purchase_date = holding.get("purchaseDate")
    if holding_update.purchaseDate:
        # New purchase date provided
        purchase_date = datetime.strptime(holding_update.purchaseDate, "%Y-%m-%d")
    elif isinstance(purchase_date, str):
        # Existing date is a string, parse it
        purchase_date = datetime.strptime(purchase_date, "%Y-%m-%d")
    elif isinstance(purchase_date, datetime):
        # Already a datetime object
        pass
    else:
        # Fallback to current date
        purchase_date = datetime.utcnow()

    # If symbol or purchaseDate changed, fetch new price
    symbol_changed = holding_update.symbol and holding_update.symbol != holding["symbol"]
    date_changed = holding_update.purchaseDate is not None
    
    if symbol_changed or date_changed:
        symbol = holding_update.symbol if holding_update.symbol else holding["symbol"]
        try:
            ticker = yf.Ticker(symbol)
            history = ticker.history(start=purchase_date, end=purchase_date + timedelta(days=1))
            if history.empty:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Could not find symbol or price for date: {symbol}, {purchase_date.strftime('%Y-%m-%d')}"
                )
            price_on_date = history['Close'].iloc[-1]
            updated_holding["purchasePrice"] = price_on_date
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Failed to fetch stock data: {e}")

    # Update fields
    if holding_update.symbol:
        updated_holding["symbol"] = holding_update.symbol
    if holding_update.shares is not None:
        updated_holding["shares"] = holding_update.shares
    if holding_update.purchaseDate:
        updated_holding["purchaseDate"] = purchase_date

    # Update the holding in the array
    holdings[holding_index] = updated_holding

    # Update the portfolio
    await portfolios.update_one(
        {"_id": ObjectId(portfolio_id)},
        {"$set": {"holdings": holdings}}
    )

    # Log transaction - track what changed
    changes = []
    if holding_update.symbol and holding_update.symbol != holding["symbol"]:
        changes.append(f"Symbol: {holding['symbol']} → {updated_holding['symbol']}")
    if holding_update.shares is not None and holding_update.shares != holding["shares"]:
        changes.append(f"Shares: {holding['shares']} → {updated_holding['shares']}")
    if holding_update.purchaseDate:
        changes.append(f"Purchase date updated")
    
    notes = "Updated holding: " + ", ".join(changes) if changes else "Holding updated"
    
    await log_transaction(
        portfolio_id=portfolio_id,
        holding_id=holding_id,
        transaction_type="EDIT",
        symbol=updated_holding["symbol"],
        shares=updated_holding["shares"],
        price=updated_holding["purchasePrice"],
        purchase_date=updated_holding["purchaseDate"],
        previous_shares=holding["shares"],
        previous_price=holding["purchasePrice"],
        previous_symbol=holding["symbol"],
        notes=notes
    )

    return {
        "message": "Holding updated successfully",
        "updated": updated_holding
    }

@portfolio_router.delete("/{portfolio_id}/holdings/{holding_id}")
async def delete_holding(
    portfolio_id: str,
    holding_id: str,
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

    # Find and remove the holding
    holdings = portfolio.get("holdings", [])
    holding_found = False
    deleted_holding = None
    
    for i, h in enumerate(holdings):
        if h.get("id") == holding_id:
            deleted_holding = h
            holdings.pop(i)
            holding_found = True
            break
    
    if not holding_found:
        raise HTTPException(status_code=404, detail="Holding not found")

    # Update the portfolio
    await portfolios.update_one(
        {"_id": ObjectId(portfolio_id)},
        {"$set": {"holdings": holdings}}
    )

    # Log transaction
    if deleted_holding:
        purchase_date = deleted_holding.get("purchaseDate")
        if isinstance(purchase_date, str):
            purchase_date = datetime.strptime(purchase_date, "%Y-%m-%d")
        elif not isinstance(purchase_date, datetime):
            purchase_date = datetime.utcnow()
        
        await log_transaction(
            portfolio_id=portfolio_id,
            holding_id=holding_id,
            transaction_type="DELETE",
            symbol=deleted_holding["symbol"],
            shares=deleted_holding["shares"],
            price=deleted_holding["purchasePrice"],
            purchase_date=purchase_date,
            notes=f"Deleted {deleted_holding['shares']} shares of {deleted_holding['symbol']}"
        )

    return {
        "message": "Holding deleted successfully"
    }

    
