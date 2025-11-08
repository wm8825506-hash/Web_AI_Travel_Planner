# app/services/ai_planner.py
import json
import re
import time
import traceback
from http import HTTPStatus

from dashscope import Generation
from app.config import settings

DASHSCOPE_API_KEY = settings.DASHSCOPE_API_KEY
MODEL_NAME = settings.MODEL_NAME

PROMPT_TEMPLATE = r"""
你是一位经验丰富的智能旅行规划师，擅长根据用户的偏好、预算、同行人数等信息制定个性化、可执行的旅行计划。

请根据以下用户输入，生成一份详细的旅行行程规划。

【输出要求】（务必严格遵循）：
1. **必须输出严格的 JSON 字符串**（不能包含任何文字说明、空行、或者 Markdown 代码块标记）。
2. JSON 结构如下（所有示例仅作格式参考，内容请根据用户需求生成）：

{
  "destination": "旅行目的地",
  "days": 5,
  "summary": "一句话概述行程主题（如：家庭温泉美食游）",
  "plan": {
    "day_1": [
      {
        "type": "交通",
        "name": "成田机场 → 新宿酒店",
        "detail": "抵达成田机场后乘坐N'EX特快列车前往新宿，全程约60分钟",
        "time": "08:00-09:30",
        "estimated_cost": 3000,
        "location": {"lat": 35.7719, "lng": 140.3929},
        "note": "建议提前购买JR PASS节省费用"
      },
      {
        "type": "景点",
        "name": "浅草寺",
        "time": "10:00-11:30",
        "estimated_cost": 0,
        "location": {"lat": 35.7148, "lng": 139.7967},
        "note": "东京最古老的寺庙，免费参观"
      },
      {
        "type": "餐饮",
        "name": "一兰拉面新宿店",
        "time": "12:00-13:00",
        "estimated_cost": 1500,
        "location": {"lat": 35.6920, "lng": 139.7006},
        "note": "当地著名连锁拉面，人均约1500元"
      },
      {
        "type": "住宿",
        "name": "东京希尔顿酒店",
        "time": "20:00",
        "estimated_cost": 15000,
        "location": {"lat": 35.6940, "lng": 139.6920},
        "note": "豪华型酒店，含早餐"
      }
    ],
    "day_2": [...]
  },
  "daily_budget": [
    {"day": 1, "estimated_total": 19500},
    {"day": 2, "estimated_total": 18000},
    {"day": 3, "estimated_total": 20000}
  ],
  "budget": {
    "currency": "RMB",
    "total": 90000,
    "transport": 10000,
    "hotel": 40000,
    "food": 15000,
    "ticket": 15000,
    "other": 10000
  },
  "personalized_tips": [
    "推荐购买东京地铁一日通票节省出行费用。",
    "带孩子可优先安排东京迪士尼或 teamLab Planets。",
    "如预算充足，建议体验箱根温泉旅馆。"
  ]
}

【生成规则】：
- 每天至少包括：交通、景点、餐饮、住宿四种类型。
- **交通项必须包含 name（如"东京站 → 富士山"）与 location（经纬度）**。
- **所有行程项必须包含 location 字段，格式为 {"lat": 纬度, "lng": 经度}，坐标系为 WGS84，lat ∈ [-90,90]，lng ∈ [-180,180]。**
- 每个行程项都必须包含 estimated_cost（数字，单位为日元）。
- 若用户预算较低，请给出经济型住宿与简餐推荐；预算充足时可加入高质量体验。
- daily_budget 表示每日预估开销；budget 为整趟旅行预算汇总。
- **输出必须是合法 JSON 对象字符串**，禁止出现多余文字、注释、或 Markdown 代码块标记。
- **确保输出完整，不要截断内容**

【用户输入】：
{user_input}
"""

def extract_json_safe(content: str):
    """
    从模型返回文本中安全提取 JSON 字符串
    """
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            content = content.strip()
            # 去掉常见的 Markdown 包裹
            content = re.sub(r"^```json", "", content)
            content = re.sub(r"^```", "", content)
            content = re.sub(r"```$", "", content)
            content = content.strip()
            return json.loads(content)
        except json.JSONDecodeError:
            # 退而求其次：截取第一个大括号块
            m = re.search(r"\{.*\}", content, re.S)
            if m:
                json_str = m.group(0)
                # 清理尾随逗号等
                json_str = re.sub(r',\s*}', '}', json_str)
                json_str = re.sub(r',\s*]', ']', json_str)
                # 尝试修复被截断的字符串
                json_str = fix_truncated_json(json_str)
                try:
                    return json.loads(json_str)
                except Exception as e:
                    print("⚠️ 二次解析失败：", e)
        time.sleep(0.3)
    print("⚠️ 无法解析JSON，原始输出预览：", repr(content[:200]))
    return {"error": "JSON解析失败", "raw": content[:1000]}

def fix_truncated_json(json_str: str) -> str:
    """
    尝试修复被截断的JSON字符串
    """
    # 如果字符串以引号结尾但没有闭合，尝试添加闭合引号
    if json_str.count('"') % 2 == 1:
        json_str += '"'
    
    # 计算开括号和闭括号数量，尝试补全缺失的括号
    open_braces = json_str.count('{')
    close_braces = json_str.count('}')
    open_brackets = json_str.count('[')
    close_brackets = json_str.count(']')
    
    # 补全缺失的大括号
    if open_braces > close_braces:
        json_str += '}' * (open_braces - close_braces)
    
    # 补全缺失的中括号
    if open_brackets > close_brackets:
        json_str += ']' * (open_brackets - close_brackets)
    
    # 如果最后一个字符是逗号，去掉它
    json_str = re.sub(r',$', '', json_str)
    
    # 确保字符串末尾是有效的结束字符
    if json_str and json_str[-1] not in ['}', ']', '"', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']:
        # 找到最后一个有效结束位置
        last_valid_pos = len(json_str) - 1
        valid_end_chars = ['}', ']', '"', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        while last_valid_pos >= 0 and json_str[last_valid_pos] not in valid_end_chars:
            last_valid_pos -= 1
        if last_valid_pos >= 0:
            json_str = json_str[:last_valid_pos+1]
            
            # 再次确保括号匹配
            open_braces = json_str.count('{')
            close_braces = json_str.count('}')
            open_brackets = json_str.count('[')
            close_brackets = json_str.count(']')
            
            if open_braces > close_braces:
                json_str += '}' * (open_braces - close_braces)
            if open_brackets > close_brackets:
                json_str += ']' * (open_brackets - close_brackets)
    
    return json_str

def normalize_location(loc):
    """
    位置字段规范化与校验：
    - 接受 {"lat": x, "lng": y} 或 {"latitude": x, "longitude": y}
    - 校验范围（WGS84）
    """
    if not isinstance(loc, dict):
        return None
    lat = loc.get("lat", loc.get("latitude"))
    lng = loc.get("lng", loc.get("longitude"))
    try:
        lat = float(lat)
        lng = float(lng)
    except (TypeError, ValueError):
        return None
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return None
    return {"lat": lat, "lng": lng}

async def generate_plan_from_query(user_query: str):
    """
    使用通义千问生成旅行行程（模型直接返回经纬度，不再做地理编码）
    """
    max_retries = 2
    for attempt in range(max_retries):
        try:
            prompt = PROMPT_TEMPLATE.replace("{user_input}", user_query)
            print("🧠 Prompt已发送至通义：", user_query)

            response = Generation.call(
                model=MODEL_NAME,
                prompt=prompt,
                api_key=DASHSCOPE_API_KEY,
                timeout=130,
            )

            if response.status_code != HTTPStatus.OK:
                print("❌ 调用通义失败：", response.message)
                if attempt < max_retries - 1:
                    print(f"🔄 重试第 {attempt + 1} 次...")
                    continue
                return {"success": False, "error": response.message}

            content = response.output.get("text", "").strip()
            print("🧩 通义原始返回预览：", repr(content[:400]))

            data = extract_json_safe(content)
            if not isinstance(data, dict) or "plan" not in data:
                print("⚠️ 解析后不是期望结构：", type(data), list(data.keys()) if isinstance(data, dict) else "")
                return {"success": False, "data": data}

            # ✅ 仅做坐标合法性校验与规范化（不再调用地理编码）
            plan_data = data.get("plan", {})
            if isinstance(plan_data, dict):
                for day, items in plan_data.items():
                    if not isinstance(items, list):
                        continue
                    for i in items:
                        if not isinstance(i, dict):
                            continue
                        if "location" in i:
                            norm = normalize_location(i["location"])
                            if norm:
                                i["location"] = norm
                            else:
                                # 坐标非法则移除 location（前端不会画点）
                                i.pop("location", None)

            return {"success": True, "data": data}

        except Exception as e:
            print("❌ AI生成行程异常：", e)
            traceback.print_exc()
            if attempt < max_retries - 1:
                print(f"🔄 重试第 {attempt + 1} 次...")
                continue
            return {"success": False, "error": str(e)}

    return {"success": False, "error": "已达到最大重试次数"}