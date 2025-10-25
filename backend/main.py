from fastapi import FastAPI
from backend.users import users_router
from backend.auth import auth_router
from backend.database import ping_db

app = FastAPI(title="Riskly Backend")

@app.on_event("startup")
async def startup_db():
    await ping_db()

app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
