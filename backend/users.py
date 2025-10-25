from fastapi import APIRouter, HTTPException
from backend.database import get_user_collection
from backend.schemas import UserCreate, UserResponse
from backend.utils import hash_password

users_router = APIRouter()

@users_router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    collection = get_user_collection()
    
    # Check if username or email exists
    if await collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    if await collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Hash password
    user_dict = user.dict()
    user_dict["password"] = hash_password(user.password)
    
    # Insert user
    await collection.insert_one(user_dict)
    
    return {"username": user.username, "email": user.email}
