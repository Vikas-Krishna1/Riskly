import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_DETAILS")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)
db_name = MONGO_DETAILS.split("/")[-1].split("?")[0]
db = client[db_name]

def get_user_collection():
    return db.get_collection("users")
