from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class FileVersionBase(BaseModel):
    id: int  
    size: int
    version_number: int
    created_at: datetime

class FileOut(BaseModel):
    id: int
    original_name: str
    content_type: str
    created_at: datetime
    current_version: FileVersionBase | None = None
    versions: List[FileVersionBase] = []

    class Config:
        from_attributes = True

class FileUploadResponse(BaseModel):
    file_id: int
    filename: str
    version: int
    status: str