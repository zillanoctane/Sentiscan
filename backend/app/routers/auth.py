"""Endpoint autentikasi: register, login, /me, update profil."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import (
    hash_password, verify_password, create_access_token, get_current_user,
)
from ..database import get_db
from ..models.user import User
from ..schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse, UpdateProfileRequest,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Email sudah terdaftar.")
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
        role=req.role,
        institution=req.institution,
        nim=req.nim,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Email atau password salah.")
    token = create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        name=user.name,
        email=user.email,
    )


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserResponse)
def update_me(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.name is not None:
        user.name = req.name
    if req.institution is not None:
        user.institution = req.institution
    if req.nim is not None:
        user.nim = req.nim
    if req.photo_url is not None:
        user.photo_url = req.photo_url
    db.commit()
    db.refresh(user)
    return user
