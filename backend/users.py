from fastapi import APIRouter, HTTPException, Depends, Response
from database import get_user_collection
from schemas import UserCreate, UserLogin, UserResponse
from utils import hash_password, verify_password, create_access_token
from auth import get_current_user

users_router = APIRouter(prefix="/users", tags=["Users"])

# CHANGE THIS LINE - remove response_model=UserCreate
@users_router.post("/register")  # ← Remove response_model
async def register_user(user: UserCreate, response: Response):
    users = get_user_collection()
    existing = await users.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    hashed = hash_password(user.password)
    new_user = {"email": user.email, "username": user.username, "password": hashed}
    await users.insert_one(new_user)
    
    # Create token
    token = create_access_token({"sub": user.email})
    
    # Set HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=1800,
    )
    
    return {"message": "User registered successfully", "username": user.username}

@users_router.post("/login")
async def login_user(user: UserLogin, response: Response):
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
    
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=1800,
    )
    
    return {
        "message": "Login successful",
        "username": db_user["username"],
        "email": db_user["email"]
    }

@users_router.post("/logout")
async def logout_user(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}

@users_router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return {
        "email": current_user["email"],
        "username": current_user["username"],
        "full_name": None
    }