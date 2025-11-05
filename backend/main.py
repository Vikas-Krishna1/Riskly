from fastapi import FastAPI
from users import users_router
from database import client
from portfolios.portfolios import portfolio_router
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(portfolio_router)




@app.get("/")
async def root():
    return {"message": "✅ API is working"}

@app.on_event("shutdown")
def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)