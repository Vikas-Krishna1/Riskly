from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from backend.database import get_user_collection
from backend.utils import hash_password, verify_password, create_access_token

users_router = APIRouter(prefix="/users", tags=["Users"])

class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@users_router.post("/register")
async def register_user(user: UserRegister):
    users = get_user_collection()
    existing = await users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(user.password)
    new_user = {"email": user.email, "password": hashed}
    await users.insert_one(new_user)
    return {"message": "User registered successfully"}

@users_router.post("/login")
async def login_user(user: UserLogin):
    users = get_user_collection()
    db_user = await users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}
