from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator
from datetime import datetime
import re


class UserCreate(BaseModel):
    email_address: EmailStr 
    password: str = Field(min_length=8)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Password must contain at least one letter and one digit."""
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v
   

class UserResponse(BaseModel):
    id: int
    email_address: EmailStr 
    is_active: bool 
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


