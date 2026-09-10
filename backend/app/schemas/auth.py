from pydantic import BaseModel, EmailStr

from app.schemas.user import UserRead


class OTPRequest(BaseModel):
    email: EmailStr
    name: str | None = None


class OTPRequestResponse(BaseModel):
    message: str
    dev_code: str | None = None


class OTPVerify(BaseModel):
    email: EmailStr
    code: str
    name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SetPasswordRequest(BaseModel):
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
