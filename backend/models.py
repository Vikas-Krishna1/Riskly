# backend/models.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class User(BaseModel):
    username: str = Field(...)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
