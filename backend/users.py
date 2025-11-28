from fastapi import APIRouter, HTTPException, Depends, Response
from bson import ObjectId
from typing import Optional
from database import get_user_collection
from schemas import UserCreate, UserLogin, UserResponse, ProfileUpdate, PublicUserProfile
from utils import hash_password, verify_password, create_access_token
from auth import get_current_user, get_optional_user

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
    domain="localhost",  # ← Add this line
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
    domain="localhost",  # ← Add this line
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
    users = get_user_collection()
    user = await users.find_one({"_id": ObjectId(current_user["id"])})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "username": current_user["username"],
        "full_name": user.get("full_name"),
        "avatar": user.get("avatar"),
        "bio": user.get("bio"),
        "displayName": user.get("displayName"),
        "theme": user.get("theme", "light"),
        "profilePrivacy": user.get("profilePrivacy", "private")
    }

@users_router.get("/{user_id}/profile", response_model=PublicUserProfile)
async def get_user_profile(user_id: str, current_user: Optional[dict] = Depends(get_optional_user)):
    users = get_user_collection()
    
    try:
        user = await users.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if profile is public or if user is viewing their own profile
    is_owner = current_user and current_user["id"] == user_id
    is_public = user.get("profilePrivacy") == "public"
    
    if not is_owner and not is_public:
        raise HTTPException(status_code=403, detail="This profile is private")
    
    return {
        "id": str(user["_id"]),
        "username": user.get("username"),
        "displayName": user.get("displayName"),
        "avatar": user.get("avatar"),
        "bio": user.get("bio") if (is_owner or is_public) else None
    }

@users_router.put("/me/profile")
async def update_profile(
    profile_update: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    users = get_user_collection()
    
    user = await users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build update dict with only provided fields
    update_data = {}
    if profile_update.avatar is not None:
        update_data["avatar"] = profile_update.avatar
    if profile_update.bio is not None:
        update_data["bio"] = profile_update.bio
    if profile_update.displayName is not None:
        update_data["displayName"] = profile_update.displayName
    if profile_update.theme is not None:
        update_data["theme"] = profile_update.theme
    if profile_update.profilePrivacy is not None:
        update_data["profilePrivacy"] = profile_update.profilePrivacy
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    await users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_data}
    )
    
    # Return updated user
    updated_user = await users.find_one({"_id": ObjectId(current_user["id"])})
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": current_user["id"],
            "email": updated_user["email"],
            "username": updated_user.get("username"),
            "avatar": updated_user.get("avatar"),
            "bio": updated_user.get("bio"),
            "displayName": updated_user.get("displayName"),
            "theme": updated_user.get("theme", "light"),
            "profilePrivacy": updated_user.get("profilePrivacy", "private")
        }
    }