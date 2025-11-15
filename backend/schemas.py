from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    username: str  # ← Make this required instead of optional
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None

    class Config:
        orm_mode = True

class HoldingCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10, description="Stock ticker symbol")
    shares: float = Field(..., gt=0, description="Number of shares")
    purchasePrice: float = Field(..., gt=0, description="Purchase price per share")
    purchaseDate: Optional[datetime] = None

class HoldingAdd(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10, description="Stock ticker symbol")
    shares: float = Field(..., gt=0, description="Number of shares")
    purchaseDate: Optional[str] = None

class HoldingUpdate(BaseModel):
    symbol: Optional[str] = Field(None, min_length=1, max_length=10, description="Stock ticker symbol")
    shares: Optional[float] = Field(None, gt=0, description="Number of shares")
    purchaseDate: Optional[str] = None

class PortfolioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Portfolio name")
    description: Optional[str] = Field(None, max_length=500, description="Portfolio description")

class PortfolioResponse(BaseModel):
    id: str
    userId: str
    name: str
    description: Optional[str] = None
    holdings: List[dict] = []
    createdAt: datetime
    
    class Config:
        orm_mode = True

class PortfolioUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class AddHoldingRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10)
    shares: float = Field(..., gt=0)
    purchasePrice: float = Field(..., gt=0)
    purchaseDate: Optional[datetime] = None
