from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=2, max_length=120)
    role: str = Field(default="pelanggan", pattern="^(analis|pelanggan)$")
    institution: Optional[str] = None
    nim: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    email: EmailStr


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    institution: Optional[str] = None
    nim: Optional[str] = None
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    institution: Optional[str] = None
    nim: Optional[str] = None
    photo_url: Optional[str] = None
