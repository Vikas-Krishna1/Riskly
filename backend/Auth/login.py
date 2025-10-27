from pydantic import BaseModel

class LoginUser(BaseModel):
    username:str
    email:str
    password:str

async def handle_login(req: LoginUser):
    print(req.username)
    print(req.email)
    print(req.password)