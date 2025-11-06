from pydantic import BaseModel
from typing import List, Optional

class TravelPlanRequest(BaseModel):
    destination: str
    days: int
    budget: float
    preferences: List[str]
    with_children: bool = False

class TravelPlanResponse(BaseModel):
    itinerary: str
    estimated_cost: float
    highlights: List[str]
