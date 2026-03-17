from fastapi import HTTPException, Depends, Request
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from database import get_user_collection

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

def verify_token(token: str) -> str:
    """Verify JWT token and return email"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

async def get_current_user(request: Request):
    """Middleware dependency to get current user from cookie"""
    # Get token from cookie instead of Authorization header
    token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please login."
        )
    
    email = verify_token(token)
    
    users = get_user_collection()
    user = await users.find_one({"email": email})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "email": user["email"],
        "username": user.get("username"),
        "id": str(user["_id"])
    }

async def get_optional_user(request: Request):
    """Optional dependency to get current user if authenticated, otherwise None"""
    token = request.cookies.get("access_token")
    
    if not token:
        return None
    
    try:
        email = verify_token(token)
        users = get_user_collection()
        user = await users.find_one({"email": email})
        
        if not user:
            return None
        
        return {
            "email": user["email"],
            "username": user.get("username"),
            "id": str(user["_id"])
        }
    except HTTPException:
        return None