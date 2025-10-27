from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None

class UserResponse(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None

    class Config:
        orm_mode = True
