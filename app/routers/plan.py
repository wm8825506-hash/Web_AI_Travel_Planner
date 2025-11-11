# app/routers/plan.py
from fastapi import APIRouter, HTTPException, Depends, Query
from app.services.ai_planner import generate_plan_from_query
from app.services.supabase_client import save_plan, list_plans, get_plan

router = APIRouter(tags=["Plan"])

@router.post("/generate")
async def generate_plan(request: dict):
    """
    request: { "query": "...", "user": "meng" }
    """
    query = request.get("query")
    user = request.get("user", "guest")
    if not query:
        raise HTTPException(status_code=400, detail="缺少 query 参数")

    result = await generate_plan_from_query(query)
    if not result.get("success"):
        return {"success": False, "error": result.get("error", "AI生成失败")}

    data = result["data"]
    # ✅ 保存到 Supabase
    plan_id = save_plan(user, data)
    data["plan_id"] = plan_id
    return {"success": True, "data": data, "plan_id": plan_id}

@router.get("/list")
def my_plans(user: str = Query(..., description="用户名")):
    plans = list_plans(user)
    return {"success": True, "data": plans}

@router.get("/{plan_id}")
def get_plan_detail(plan_id: str):
    data = get_plan(plan_id)
    if not data:
        raise HTTPException(status_code=404, detail="行程不存在")
    return {"success": True, "data": data}
