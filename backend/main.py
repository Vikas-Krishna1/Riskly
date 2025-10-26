from fastapi import FastAPI
from backend.users import users_router
from backend.database import client

app = FastAPI(title="Riskly Backend")

@app.on_event("startup")
async def startup_event():
    print("✅ Connected to MongoDB:", client.address)

@app.on_event("shutdown")
async def shutdown_event():
    client.close()
    print("🛑 MongoDB connection closed")

app.include_router(users_router)

@app.get("/")
async def root():
    return {"message": "Riskly API running successfully"}
