import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_DETAILS")  # MongoDB URI

client = AsyncIOMotorClient(MONGO_DETAILS)
default_db = client.get_default_database()
db_name = default_db.name if default_db is not None else "Riskly"
db = client[db_name]

def get_user_collection():
    return db["users"]

print(f"✅ Connected to MongoDB: {client.address}")
print(f"Using database: {db_name}")