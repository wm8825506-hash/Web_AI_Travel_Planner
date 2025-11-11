# app/routers/budget.py
from fastapi import APIRouter, HTTPException
from app.services.supabase_client import add_expense, list_expenses

router = APIRouter(tags=["Budget"])

@router.post("/add")
def add_budget_record(record: dict):
    """
    record: { user, plan_id, category, amount, description? }
    """
    try:
        add_expense(
            user_name=record.get("user", "guest"),
            plan_id=record["plan_id"],
            category=record["category"],
            amount=float(record["amount"]),
            note=record.get("description"),  # 改为使用description字段
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/summary/{plan_id}")
def get_budget_summary(plan_id: str):
    rows = list_expenses(plan_id)
    summary = {}
    total = 0.0
    for r in rows:
        cat = r["category"]
        amt = float(r["amount"])
        summary[cat] = summary.get(cat, 0.0) + amt
        total += amt
    return {"success": True, "summary": summary, "total": total, "items": rows}