from fastapi import FastAPI
from users import users_router
from database import client

app = FastAPI()
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