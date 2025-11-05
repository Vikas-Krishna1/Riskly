from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None  # ✅ stops 400 issues

class UserResponse(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
