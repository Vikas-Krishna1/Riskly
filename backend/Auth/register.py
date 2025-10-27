from pydantic import BaseModel

class RequestRegister(BaseModel):
    username: str
    email: str
    password: str

async def handle_register(req: RequestRegister):
    print(req.username)
    print(req.email)
    print(req.password)

    return {"message": f"User {req.username} registered successfully!"}