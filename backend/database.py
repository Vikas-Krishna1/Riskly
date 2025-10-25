# backend/database.py
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_DETAILS")
client = AsyncIOMotorClient(MONGO_DETAILS)
db = client.get_default_database()  # picks DB from connection string

async def ping_db():
    try:
        await client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas!")
    except Exception as e:
        print("❌ Could not connect to MongoDB:", e)

def get_user_collection():
    return db["users"]  # returns the 'users' collection
