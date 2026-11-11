from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

STAGES = ["lead", "contacted", "qualified", "proposal", "won", "lost"]

class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    company: str = Field(min_length=1, max_length=180)
    email: Optional[EmailStr] = None
    value: int = Field(default=0, ge=0)
    stage: str = "lead"
    last_contact: str = "Not contacted"
    last_contact_date: Optional[date] = None
    notes: str = ""

    @field_validator("email", mode="before")
    @classmethod
    def empty_email(cls, value):
        return None if value == "" else value

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=160)
    company: Optional[str] = Field(default=None, min_length=1, max_length=180)
    email: Optional[EmailStr] = None
    value: Optional[int] = Field(default=None, ge=0)
    stage: Optional[str] = None
    last_contact: Optional[str] = None
    last_contact_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_email(cls, value):
        return None if value == "" else value

class CustomerRead(BaseModel):
    id: int
    name: str
    company: str
    email: Optional[str]
    value: int
    stage: str
    last_contact: str
    last_contact_date: Optional[date]
    notes: str
    score: int = 0
    model_config = ConfigDict(from_attributes=True)

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    detail: str = ""
    due: str = "Today"

class TaskRead(TaskCreate):
    id: int
    done: bool
    model_config = ConfigDict(from_attributes=True)

class ActivityRead(BaseModel):
    id: int
    title: str
    detail: str
    created: datetime
    model_config = ConfigDict(from_attributes=True)
