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

【输出要求】：
1. **必须输出严格的 JSON 字符串**（不能包含任何文字说明、空行、或者 Markdown 代码块标记）。
2. JSON 结构如下（内容请根据用户需求生成）：

{
  "destination": "旅行目的地",
  "days": 5,
  "summary": "一句话简短概述行程主题",
  "plan": {
    "day_1": [
      {
        "type": "交通",
        "name": "起点 → 终点",
        "detail": "交通方式及说明",
        "time": "09:00-10:00",
        "estimated_cost": 100,
        "location": {
          "start": {"lat": 35.6812, "lng": 139.7671},
          "end": {"lat": 35.6895, "lng": 139.6917}
        }
      },
      {
        "type": "景点/餐饮/住宿",
        "name": "景点/餐饮/住宿名称",
        "time": "10:30-12:00",
        "estimated_cost": 50,
        "location": {"lat": 35.6895, "lng": 139.6917},
        "note": "简要描述"
      } 
    ]
  },
  "daily_budget": [
    {"day": 1, "estimated_total": 500}
  ],
  "budget": {
    "currency": "RMB",
    "total": 2000,
    "transport": 500,
    "hotel": 1000,
    "food": 300,
    "ticket": 200
  },
  "personalized_tips": [
    "实用建议"
  ]
}

【生成规则】：
- 每天至少包括：交通、景点、餐饮、住宿四种类型（最后一天可以没有住宿）。
- **每个非交通活动（景点、餐饮、住宿）都必须有前置的交通信息**。
- **所有行程项必须包含 location 字段**，格式为 {"lat": 纬度, "lng": 经度}。
- 每个行程项都必须包含 estimated_cost（数字）。
- daily_budget 表示每日预算开销；budget 为整趟旅行预算汇总。
- **输出必须是合法 JSON 对象字符串**，禁止出现多余文字。
- **确保输出完整，不要截断内容**
- **确保所有属性名都使用双引号包围**

【重要说明】：
- 交通信息必须前置：每个景点/餐饮/住宿前必须有相应的交通信息
- 交通起点是上一个活动的地点，终点是当前活动的地点
- 确保交通时间和活动时间连续且合理
- 时间安排需考虑地理位置的合理性。

【用户输入】：
{user_input}
"""

def extract_json_safe(content: str):
    """
    从模型返回文本中安全提取 JSON 字符串
    """
    max_attempts = 5  # 增加尝试次数
    for attempt in range(max_attempts):
        try:
            content = content.strip()
            # 去掉常见的 Markdown 包裹
            content = re.sub(r"^```json", "", content)
            content = re.sub(r"^```", "", content)
            content = re.sub(r"```$", "", content)
            content = content.strip()
            
            # 查找第一个 { 和最后一个 } 之间的内容
            first_brace = content.find('{')
            last_brace = content.rfind('}')
            
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                content = content[first_brace:last_brace+1]
            
            return json.loads(content)
        except json.JSONDecodeError as e:
            print(f"⚠️ JSON解析错误: {e}")
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
            # 如果是逗号缺失问题，尝试进一步修复
            if "Expecting ',' delimiter" in str(e):
                # 尝试在数字和引号之间添加逗号
                content = re.sub(r'(\d)(\s*")', r'\1, \2', content)
                try:
                    return json.loads(content)
                except:
                    pass
            # 如果是属性名未加引号问题
            if "Expecting property name enclosed in double quotes" in str(e):
                content = re.sub(r'([{,])\s*([a-zA-Z_]\w*)\s*:', r'\1"\2":', content)
                try:
                    return json.loads(content)
                except:
                    pass
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
    
    # 修复可能的JSON语法错误
    # 修复属性名未用双引号包围的问题
    json_str = re.sub(r'([{,])\s*([a-zA-Z_]\w*)\s*:', r'\1"\2":', json_str)
    
    # 修复被截断的字符串
    json_str = re.sub(r'([^\\])"$', r'\1"', json_str)
    
    # 修复缺失的冒号
    json_str = re.sub(r'("\w+")\s*("[^"]*")', r'\1:\2', json_str)  # 修复冒号后有空格的问题
    json_str = re.sub(r'("\w+")\s*([{\[\d])', r'\1:\2', json_str)  # 修复属性值前缺少冒号的问题
    
    # 修复缺失的逗号
    json_str = re.sub(r'(\})(\s*")', r'\1,\2', json_str)
    json_str = re.sub(r'(\})(\s*\{)', r'\1,\2', json_str)
    json_str = re.sub(r'(\])(\s*")', r'\1,\2', json_str)
    json_str = re.sub(r'(\])(\s*\{)', r'\1,\2', json_str)
    
    # 修复数字后面缺少逗号的问题
    json_str = re.sub(r'(\d)(\s*")', r'\1,\2', json_str)
    
    # 修复字符串中包含未转义的引号
    # 查找可能的未闭合字符串
    parts = json_str.split('"')
    if len(parts) % 2 == 0:  # 引号数量不匹配
        # 尝试找到可能的错误引号并修复
        for i in range(len(parts)-1, 0, -1):
            if parts[i].strip() and not parts[i].endswith(','):
                # 在这个位置可能缺少闭合引号
                parts[i] = parts[i] + '"'
                break
        json_str = '"'.join(parts)
    
    # 修复空键问题
    json_str = re.sub(r'"":', '"empty_key":', json_str)
    
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

def extract_locations_from_transport(transport_item):
    """
    从交通项中提取所有位置坐标
    """
    locations = []
    
    # 处理新的routes格式
    if "routes" in transport_item and isinstance(transport_item["routes"], list):
        for route in transport_item["routes"]:
            if "locations" in route and isinstance(route["locations"], list):
                for loc in route["locations"]:
                    if "lat" in loc and "lng" in loc:
                        locations.append({
                            "name": loc.get("name", ""),
                            "lat": loc["lat"],
                            "lng": loc["lng"]
                        })
    
    # 处理旧格式
    elif "location" in transport_item:
        loc = transport_item["location"]
        # 处理start/end格式
        if "start" in loc and "end" in loc:
            start_loc = normalize_location(loc["start"])
            end_loc = normalize_location(loc["end"])
            if start_loc:
                locations.append({
                    "name": "起点",
                    "lat": start_loc["lat"],
                    "lng": start_loc["lng"]
                })
            if end_loc:
                locations.append({
                    "name": "终点",
                    "lat": end_loc["lat"],
                    "lng": end_loc["lng"]
                })
        # 处理单点格式
        else:
            norm_loc = normalize_location(loc)
            if norm_loc:
                locations.append({
                    "name": transport_item.get("name", "交通点"),
                    "lat": norm_loc["lat"],
                    "lng": norm_loc["lng"]
                })
    
    return locations

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
                        # 处理普通活动的位置信息
                        if "location" in i:
                            norm = normalize_location(i["location"])
                            if norm:
                                i["location"] = norm
                            else:
                                # 坐标非法则移除 location（前端不会画点）
                                i.pop("location", None)
                        
                        # 处理交通活动的位置信息
                        if i.get("type") == "交通":
                            # 从交通项中提取位置信息，用于前端地图展示
                            transport_locations = extract_locations_from_transport(i)
                            # 可以将这些位置信息存储在额外字段中，供前端使用
                            if transport_locations:
                                i["_transport_locations"] = transport_locations

            return {"success": True, "data": data}

        except Exception as e:
            print("❌ AI生成行程异常：", e)
            traceback.print_exc()
            if attempt < max_retries - 1:
                print(f"🔄 重试第 {attempt + 1} 次...")
                continue
            return {"success": False, "error": str(e)}

    return {"success": False, "error": "已达到最大重试次数"}