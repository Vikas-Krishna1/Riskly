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
    avatar: Optional[str] = None
    bio: Optional[str] = None
    displayName: Optional[str] = None
    theme: Optional[str] = "light"
    profilePrivacy: Optional[str] = "private"

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
    isPublic: Optional[bool] = False

class PortfolioResponse(BaseModel):
    id: str
    userId: str
    name: str
    description: Optional[str] = None
    holdings: List[dict] = []
    createdAt: datetime
    isPublic: Optional[bool] = False
    shareToken: Optional[str] = None
    ownerUsername: Optional[str] = None
    
    class Config:
        orm_mode = True

class PortfolioUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    isPublic: Optional[bool] = None

class AddHoldingRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10)
    shares: float = Field(..., gt=0)
    purchasePrice: float = Field(..., gt=0)
    purchaseDate: Optional[datetime] = None

# Transaction schemas
class TransactionResponse(BaseModel):
    id: str
    portfolioId: str
    holdingId: str
    transactionType: str  # "BUY", "SELL", "EDIT", "DELETE"
    symbol: str
    shares: float
    price: float
    purchaseDate: datetime
    previousShares: Optional[float] = None  # For edits
    previousPrice: Optional[float] = None  # For edits
    previousSymbol: Optional[str] = None  # For edits
    timestamp: datetime
    notes: Optional[str] = None
    
    class Config:
        orm_mode = True

# Portfolio sharing schemas
class PortfolioShare(BaseModel):
    shareToken: str
    isPublic: bool
    shareUrl: str

class PublicPortfolioResponse(BaseModel):
    id: str
    userId: str
    name: str
    description: Optional[str] = None
    holdings: List[dict] = []
    createdAt: datetime
    ownerUsername: Optional[str] = None
    ownerDisplayName: Optional[str] = None
    
    class Config:
        orm_mode = True

# Profile customization schemas
class ProfileUpdate(BaseModel):
    avatar: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)
    displayName: Optional[str] = Field(None, max_length=100)
    theme: Optional[str] = Field(None, pattern="^(light|dark|auto)$")
    profilePrivacy: Optional[str] = Field(None, pattern="^(public|private)$")

class PublicUserProfile(BaseModel):
    id: str
    username: Optional[str] = None
    displayName: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    
    class Config:
        orm_mode = True