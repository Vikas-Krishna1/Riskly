from fastapi import APIRouter, HTTPException, Header
from database import get_user_collection
from schemas import UserCreate, UserLogin, UserResponse
from utils import hash_password, verify_password, create_access_token
from auth import verify_token

users_router = APIRouter(prefix="/users", tags=["Users"])

@users_router.post("/register", response_model=UserCreate)
async def register_user(user: UserCreate):
    users = get_user_collection()
    existing = await users.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    hashed = hash_password(user.password)
    new_user = {"email": user.email, "username": user.username, "password": hashed}
    await users.insert_one(new_user)
    return new_user

@users_router.post("/login")
async def login_user(user: UserLogin):
    users = get_user_collection()
    db_user = await users.find_one({
        "$or": [
            {"email": user.email},
            {"username": user.username} if user.username else {}
        ]
    })
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": db_user["email"]})
    return {"access_token": token, "token_type": "bearer"}

@users_router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: str = Header(...)):
    token = authorization.split(" ")[1] if " " in authorization else authorization
    email = verify_token(token)
    users = get_user_collection()
    user = await users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"email": user["email"], "username": user.get("username"), "full_name": None}
