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
def get_portfolio_collection():
    return db["portfolios"]
def get_transaction_collection():
    return db["transactions"]
def get_health_score_collection():
    return db["health_scores"]
def get_alert_collection():
    return db["alerts"]

print(f"✅ Connected to MongoDB: {client.address}")
print(f"Using database: {db_name}")