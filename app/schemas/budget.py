# app/schemas/budget.py
from pydantic import BaseModel
from typing import Optional
import datetime

class BudgetRecordCreate(BaseModel):
    username: str
    plan_id: str
    category: str
    amount: float
    description: Optional[str] = None

class BudgetRecord(BudgetRecordCreate):
    id: int
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True