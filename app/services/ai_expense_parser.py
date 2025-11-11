# app/services/ai_expense_parser.py
from dashscope import Generation
from app.config import settings

DASHSCOPE_API_KEY = settings.DASHSCOPE_API_KEY
MODEL_NAME = settings.MODEL_NAME

PROMPT_PARSE_EXPENSE = """
你是一个理财助手，请将用户描述的支出语句转成结构化JSON：
格式：
{
  "category": "餐饮/交通/门票/住宿/购物/其他",
  "amount": 金额（数字）
}
示例：
输入："我花了200元打车去机场" → {"category": "交通", "amount": 200}
输入："吃饭花了350块" → {"category": "餐饮", "amount": 350}
输入："买门票120元" → {"category": "门票", "amount": 120}
只输出 JSON。
"""

def parse_expense_text(text: str):
    try:
        response = Generation.call(
            model=MODEL_NAME,
            prompt=PROMPT_PARSE_EXPENSE + f"\n输入：{text}\n输出：",
            api_key=DASHSCOPE_API_KEY,
            result_format="json",
            max_output_tokens=512,
            timeout=60,
        )

        content = response.output.get("text") or response.output["choices"][0]["message"]["content"]
        result = content.strip()

        import json
        data = json.loads(result)
        return {"success": True, "category": data["category"], "amount": float(data["amount"])}
    except Exception as e:
        print("❌ AI解析支出失败：", e)
        return {"success": False, "error": str(e)}
