import openai
import json, re,time
from app.config import settings
from dashscope import Generation
from http import HTTPStatus

DASHSCOPE_API_KEY = settings.DASHSCOPE_API_KEY
MODEL_NAME = settings.MODEL_NAME

PROMPT_TEMPLATE = """
你是一位智能旅行规划师，请根据用户输入的自然语言描述生成一个详细的旅行行程规划。

【生成要求】：
1. 输出格式为 JSON。
2. 内容包括：
   - destination: 旅行目的地
   - days: 旅行天数（推测或从描述中提取）
   - budget: 用户预算（若未提及请合理估计）
   - summary: 一句话概述本次行程主题
   - itinerary: 每日计划数组（包含 day, activity, cost）
   - total_cost: 总花费估算

【示例输出】：
{{
  "destination": "日本东京",
  "days": 5,
  "budget": "8000元",
  "summary": "一次包含美食、温泉和亲子游的五日东京之旅",
  "itinerary": [
    {{"day": 1, "activity": "抵达东京，入住酒店，浅草寺参观，品尝拉面", "cost": 1200}},
    {{"day": 2, "activity": "东京迪士尼一日游", "cost": 1500}},
    {{"day": 3, "activity": "前往箱根泡温泉，体验日式旅馆", "cost": 1600}},
    {{"day": 4, "activity": "新宿购物、美食街探索", "cost": 1300}},
    {{"day": 5, "activity": "回程前自由活动，机场购物返程", "cost": 1400}}
  ],
  "total_cost": 7000
}}

【用户需求】：
{user_query}

请直接输出符合以上结构的JSON，不要添加其他文字说明。
"""


async def generate_plan_from_query(user_query: str):
    """
    使用通义千问（DashScope）生成旅行行程
    """
    try:
        prompt = PROMPT_TEMPLATE.format(user_query=user_query)

        # 尝试三次请求，防止偶发超时
        for attempt in range(3):
            try:
                response = Generation.call(
                    model=MODEL_NAME,
                    prompt=prompt,
                    api_key=DASHSCOPE_API_KEY,
                    # ✅ 设置超时时间为 60 秒
                    timeout=200,
                )

                if response.status_code == HTTPStatus.OK:
                    content = response.output.get("text", "").strip()
                    print("🧠 通义返回原始文本：\n", content)

                    # 尝试解析JSON
                    try:
                        data = json.loads(content)
                    except json.JSONDecodeError:
                        start = content.find("{")
                        end = content.rfind("}")
                        if start >= 0 and end > start:
                            data = json.loads(content[start:end+1])
                        else:
                            data = {"error": "通义输出格式不符合JSON规范", "raw": content}

                    return {"success": True, "data": data}

                else:
                    print(f"⚠️ 第 {attempt+1} 次调用失败: {response.message}")
                    time.sleep(2)

            except Exception as e:
                print(f"⚠️ 第 {attempt+1} 次调用异常: {e}")
                time.sleep(2)

        return {"success": False, "error": "多次调用超时或失败"}

    except Exception as e:
        print("❌ 通义千问生成行程异常：", e)
        return {"success": False, "error": str(e)}