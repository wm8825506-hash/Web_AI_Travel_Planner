from fastapi import APIRouter, Body
from app.services.ai_planner import generate_plan_from_query
import asyncio
import traceback

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
        
        # 如果返回的是错误信息，也返回给前端
        if not result.get("success", False) and "data" in result:
            return {"success": False, "error": "AI生成内容格式错误", "raw_data": result["data"]}
            
        return result

    except asyncio.CancelledError:
        # 客户端断开连接或请求被取消
        print("⚠️ 请求被取消")
        raise  # 重新抛出取消异常，让FastAPI正确处理

    except Exception as e:
        print("❌ 行程生成异常：", traceback.format_exc())
        return {"success": False, "error": str(e)}