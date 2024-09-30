from typing import List
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

class User(BaseModel):
    username: str
    email: EmailStr
    hashed_password: str

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError('Invalid ObjectId')
        return ObjectId(v)

class Message(BaseModel):
    sender: str
    text: str
    timestamp: float

class Conversation(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')
    user_id: str
    messages: List[Message]

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
