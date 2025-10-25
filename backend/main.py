from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Auth.register import handle_register, RequestRegister
from Auth.login import handle_login, LoginUser

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "FastAPI is running!"}

@app.post("/api/register")
async def register(req: RequestRegister):
    return await handle_register(req)
@app.post("/api/login")
async def login(req: LoginUser):
    return await handle_login(req)
