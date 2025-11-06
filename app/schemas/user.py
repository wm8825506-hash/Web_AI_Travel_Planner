# app/schemas/user.py
from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserRead(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True  # Pydantic V2 替换 orm_mode

class UserLogin(BaseModel):
    username: str
    password: str
