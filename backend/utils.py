# backend/utils.py
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os
from dotenv import load_dotenv

load_dotenv()  # load .env variables

# --- Password hashing setup ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
BCRYPT_MAX_BYTES = 72  # bcrypt limitation

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt, truncating if it's longer than 72 bytes.
    """
    truncated = password.encode("utf-8")[:BCRYPT_MAX_BYTES]
    return pwd_context.hash(truncated)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a bcrypt hash, truncating to 72 bytes.
    """
    truncated = plain_password.encode("utf-8")[:BCRYPT_MAX_BYTES]
    return pwd_context.verify(truncated, hashed_password)

# --- JWT setup ---
SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Create a JWT token with optional expiration.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """
    Decode a JWT token. Raises JWTError if invalid.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
