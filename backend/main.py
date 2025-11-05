from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from users import users_router
from database import client

app = FastAPI()

# CORS FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # <- OPTIONS allowed here
    allow_headers=["*"],
)

app.include_router(users_router)

@app.get("/")
async def root():
    return {"message": "✅ API is working"}

@app.on_event("shutdown")
def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
