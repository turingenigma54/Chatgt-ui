from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    username: str
    email: EmailStr

class UserInDB(UserOut):
    hashed_password: str

class ChatRequest(BaseModel):
    prompt: str
    conversation_id: Optional[str] = None
    