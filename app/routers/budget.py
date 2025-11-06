from fastapi import APIRouter

router = APIRouter(prefix="/budget", tags=["Budget"])

@router.get("/")
async def budget_root():
    return {"message": "Budget router is working"}

@router.post("/estimate")
async def estimate_budget(destination: str, days: int):
    return {"destination": destination, "days": days, "estimated_cost": days * 800}
