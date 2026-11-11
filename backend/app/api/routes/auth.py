from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from app.core.security import create_token, current_user, hash_password, verify_password
from app.core.limiter import limiter
from app.database.session import get_db
from app.models.customer import Activity, Customer, Task, User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class RegisterBody(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)

class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

def auth_response(user: User):
    return {"access_token": create_token(user), "token_type": "bearer", "user": {"id": user.id, "name": user.name, "email": user.email}}

@router.post("/register", status_code=201)
@limiter.limit("10/minute")
def register(request: Request, body: RegisterBody, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "An account with this email already exists")
    user = User(name=body.name.strip(), email=email, password_hash=hash_password(body.password))
    db.add(user); db.flush()
    # The first account adopts data created by the old single-user app.
    if db.query(User).count() == 1:
        for model in (Customer, Task, Activity):
            db.query(model).filter(model.owner_id.is_(None)).update({model.owner_id: user.id})
    db.commit(); db.refresh(user)
    return auth_response(user)

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, body: LoginBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Email or password is incorrect")
    return auth_response(user)

@router.get("/me")
def me(user: User = Depends(current_user)):
    return {"id": user.id, "name": user.name, "email": user.email}
