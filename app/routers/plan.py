from fastapi import APIRouter, Body
from app.services.ai_planner import generate_plan_from_query

router = APIRouter(prefix="/plan", tags=["Plan"])

@router.post("/generate")
async def generate_plan(payload: dict = Body(...)):
    """
    AI 行程规划生成接口
    """
    try:
        user_query = payload.get("query", "")
        if not user_query:
            return {"success": False, "error": "缺少用户输入 query"}

        result = await generate_plan_from_query(user_query)
        return result

    except Exception as e:
        return {"success": False, "error": str(e)}
