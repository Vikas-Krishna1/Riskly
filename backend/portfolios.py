from fastapi import APIRouter, HTTPException, Depends, status
from database import db
from schemas import PortfolioCreate, PortfolioUpdate, PortfolioResponse
from auth import get_current_user_email
from bson import ObjectId
from typing import List
from datetime import datetime

portfolios_router = APIRouter(prefix="/portfolios", tags=["Portfolios"])

def get_portfolios_collection():
    return db["portfolios"]

def portfolio_helper(portfolio) -> dict:
    """Convert MongoDB document to response format"""
    return {
        "id": str(portfolio["_id"]),
        "name": portfolio["name"],
        "description": portfolio.get("description", ""),
        "symbols": portfolio.get("symbols", []),
        "user_email": portfolio["user_email"],
        "created_at": portfolio.get("created_at"),
        "updated_at": portfolio.get("updated_at"),
    }

@portfolios_router.post("/", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    portfolio: PortfolioCreate,
    email: str = Depends(get_current_user_email)
):
    """
    Create a new portfolio for the authenticated user.
    """
    portfolios = get_portfolios_collection()
    
    new_portfolio = {
        "name": portfolio.name,
        "description": portfolio.description,
        "symbols": portfolio.symbols or [],
        "user_email": email,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    result = await portfolios.insert_one(new_portfolio)
    created_portfolio = await portfolios.find_one({"_id": result.inserted_id})
    
    return portfolio_helper(created_portfolio)

@portfolios_router.get("/", response_model=List[PortfolioResponse])
async def get_user_portfolios(email: str = Depends(get_current_user_email)):
    """
    Get all portfolios for the authenticated user.
    """
    portfolios = get_portfolios_collection()
    cursor = portfolios.find({"user_email": email}).sort("created_at", -1)
    portfolio_list = await cursor.to_list(length=100)
    
    return [portfolio_helper(portfolio) for portfolio in portfolio_list]

@portfolios_router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(
    portfolio_id: str,
    email: str = Depends(get_current_user_email)
):
    """
    Get a specific portfolio by ID. Only accessible by the owner.
    """
    portfolios = get_portfolios_collection()
    
    if not ObjectId.is_valid(portfolio_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portfolio ID"
        )
    
    portfolio = await portfolios.find_one({
        "_id": ObjectId(portfolio_id),
        "user_email": email
    })
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    return portfolio_helper(portfolio)

@portfolios_router.put("/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(
    portfolio_id: str,
    portfolio_update: PortfolioUpdate,
    email: str = Depends(get_current_user_email)
):
    """
    Update a portfolio. Only accessible by the owner.
    """
    portfolios = get_portfolios_collection()
    
    if not ObjectId.is_valid(portfolio_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portfolio ID"
        )
    
    # Check if portfolio exists and belongs to user
    existing = await portfolios.find_one({
        "_id": ObjectId(portfolio_id),
        "user_email": email
    })
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Build update dict with only provided fields
    update_data = {"updated_at": datetime.utcnow().isoformat()}
    
    if portfolio_update.name is not None:
        update_data["name"] = portfolio_update.name
    if portfolio_update.description is not None:
        update_data["description"] = portfolio_update.description
    if portfolio_update.symbols is not None:
        update_data["symbols"] = portfolio_update.symbols
    
    await portfolios.update_one(
        {"_id": ObjectId(portfolio_id)},
        {"$set": update_data}
    )
    
    updated_portfolio = await portfolios.find_one({"_id": ObjectId(portfolio_id)})
    return portfolio_helper(updated_portfolio)

@portfolios_router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(
    portfolio_id: str,
    email: str = Depends(get_current_user_email)
):
    """
    Delete a portfolio. Only accessible by the owner.
    """
    portfolios = get_portfolios_collection()
    
    if not ObjectId.is_valid(portfolio_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portfolio ID"
        )
    
    result = await portfolios.delete_one({
        "_id": ObjectId(portfolio_id),
        "user_email": email
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    return None

