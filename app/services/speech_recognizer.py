import hashlib
import hmac
import base64
import json
import websocket  # 注意：这里用 websocket-client，不是 websockets
import ssl
from urllib.parse import urlencode
import threading
from datetime import datetime
from wsgiref.handlers import format_date_time
from time import mktime, sleep
import traceback
import time
from app.config import settings
import os

APPID = settings.SPEECH_APP_ID
API_KEY = settings.SPEECH_API_KEY
API_SECRET = settings.SPEECH_API_SECRET

# 科大讯飞配置
# APPID = "5a4dcbac"
# API_KEY = "0d0e1513855a9938ff972c2e80aa20a9"
# API_SECRET = "ZGNkNTQ2ZjQ1YjI0YmNmYjIzNTE3NzIw"

# HOST = "iat.cn-huabei-1.xf-yun.com"
# ASR_URL = f"wss://{HOST}/v1"
#
# def get_auth_url():
#     # 构建鉴权URL
#     now = time.gmtime()
#     date = time.strftime("%a, %d %b %Y %H:%M:%S GMT", now)
#     signature_origin = f"host: {HOST}\ndate: {date}\nGET /v1 HTTP/1.1"
#     signature_sha = hmac.new(API_SECRET.encode('utf-8'),
#                              signature_origin.encode('utf-8'),
#                              digestmod=hashlib.sha256).digest()
#     signature_sha_base64 = base64.b64encode(signature_sha).decode('utf-8')
#     authorization_origin = f'api_key="{API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature_sha_base64}"'
#     authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')
#     v = {
#         "authorization": authorization,
#         "date": date,
#         "host": HOST
#     }
#     url = ASR_URL + '?' + urlencode(v)
#     return url
#
# def recognize_audio(audio_bytes: bytes):
#     """科大讯飞 WebSocket 语音识别"""
#     url = get_auth_url()
#     ws = websocket.WebSocket(sslopt={"cert_reqs": ssl.CERT_NONE})
#     ws.connect(url)
#
#     # 发送音频数据帧
#     frame = {
#         "common": {"app_id": APPID},
#         # "business": {"language": "zh_cn", "domain": "iat", "accent": "mandarin"},
#         "business": {
#             "language": "zh_cn",
#             "domain": "iat",
#             "accent": "mandarin",
#             "ent": "aisound",
#             "vinfo": 1,
#             "vad_eos": 10000
#         },
#         "data": {
#             "status": 2,
#             "format": "audio/L16;rate=16000",
#             "encoding": "raw",
#             "audio": base64.b64encode(audio_bytes).decode('utf-8')
#         }
#     }
#     ws.send(json.dumps(frame))
#     result = ""
#
#     # 等待返回
#     while True:
#         msg = ws.recv()
#         if not msg:
#         break
#         # msg_dict = json.loads(msg)
#         # if msg_dict["code"] != 0:
#         try:
#             msg_dict = json.loads(msg)
#             print("🛰️ 讯飞返回：", msg_dict)
#         except Exception as e:
#             print("⚠️ 无法解析响应：", msg)
#             continue
#
#         # 判断是否有错误
#         if msg_dict.get("code", 0) != 0:
#             print("🚫 讯飞返回错误：", msg_dict)
#             break
#
#         if "data" in msg_dict and "result" in msg_dict["data"]:
#             words = "".join([w["cw"][0]["w"] for w in msg_dict["data"]["result"]["ws"]])
#             result += words
#         # status == 2 表示结束
#         if msg_dict.get("data", {}).get("status") == 2:
#             break
#
#     ws.close()
#     return result
# app/services/xfyun_asr.py

# STATUS_FIRST_FRAME = 0
# STATUS_CONTINUE_FRAME = 1
# STATUS_LAST_FRAME = 2
def create_url():
    """生成鉴权 URL"""
    host = "iat-api.xfyun.cn"
    path = "/v2/iat"
    now = datetime.utcnow()
    date = now.strftime("%a, %d %b %Y %H:%M:%S GMT")
    signature_origin = f"host: {host}\ndate: {date}\nGET {path} HTTP/1.1"

    signature_sha = hmac.new(API_SECRET.encode('utf-8'),
                             signature_origin.encode('utf-8'),
                             digestmod=hashlib.sha256).digest()
    signature_sha_base64 = base64.b64encode(signature_sha).decode('utf-8')
    authorization_origin = (
        f'api_key="{API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature_sha_base64}"'
    )
    authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')

    v = {"authorization": authorization, "date": date, "host": host}
    return f"wss://{host}{path}?" + urlencode(v)


def xfyun_speech_to_text(file_path: str):
    """
    调用科大讯飞 WebSocket 语音识别接口 (16kHz PCM WAV)
    并打印每一步的详细响应。
    """
    try:
        # 检查文件是否存在
        if not os.path.exists(file_path):
            print(f"❌ 文件不存在: {file_path}")
            return ""
            
        # 检查文件是否为空
        if os.path.getsize(file_path) == 0:
            print(f"❌ 文件为空: {file_path}")
            return ""
        
        url = create_url()
        ws = websocket.WebSocket()
        ws.connect(url, sslopt={"cert_reqs": ssl.CERT_NONE})
        print(f"🛰️ 已连接讯飞WebSocket：{url}")

        # 读取音频（以二进制模式读取）
        with open(file_path, "rb") as f:
            audio_data = f.read()

        segment_size = 1280
        index = 0
        result_text = ""

        # 循环发送音频分片
        while index < len(audio_data):
            chunk = audio_data[index:index + segment_size]
            base64_chunk = base64.b64encode(chunk).decode('utf-8')

            if index == 0:
                frame = {
                    "common": {"app_id": APPID},
                    "business": {
                        "language": "zh_cn",  # 明确指定中文
                        "domain": "iat",  # 使用语音听写模型
                        "accent": "mandarin",  # 普通话
                        "ptt": 1,  # 开启标点
                        "rlang": "zh",  # 明确关闭英文自动切换
                        "nunum": 0,  # 不允许数字替换
                        "vinfo": 1,
                        "vad_eos": 5000,  # 语音结束超时
                        "dwa": "wpgs"  # 开启动态修正
                    },

                    "data": {
                        "status": 0,
                        "format": "audio/L16;rate=16000",
                        "encoding": "raw",
                        "audio": base64_chunk
                    }
                }
            else:
                frame = {
                    "data": {
                        "status": 1,
                        "format": "audio/L16;rate=16000",
                        "encoding": "raw",
                        "audio": base64_chunk
                    }
                }

            ws.send(json.dumps(frame))
            index += segment_size
            time.sleep(0.04)  # 模拟流式发送间隔

        # 发送结束帧
        ws.send(json.dumps({
            "data": {"status": 2, "format": "audio/L16;rate=16000", "encoding": "raw", "audio": ""}
        }))
        print("📤 已发送全部音频数据，等待讯飞响应...")

        # 接收响应
        while True:
            msg = ws.recv()
            if not msg:
                break

            try:
                data = json.loads(msg)
            except json.JSONDecodeError:
                print("⚠️ 无法解析为JSON：", msg)
                continue

            print("🛰️ 收到讯飞返回：", json.dumps(data, ensure_ascii=False))

            # ✅ 有 header 的标准响应
            if "header" in data:
                code = data["header"].get("code", 0)
                if code != 0:
                    print(f"❌ 识别错误：code={code}, message={data['header'].get('message', '')}")
                    break

            # ✅ 兼容新版接口格式 (无header，直接有code/message)
            elif "code" in data:
                if data["code"] != 0:
                    print(f"❌ 识别失败：code={data['code']}, message={data.get('message', '')}")
                    break

            # ✅ 提取识别结果
            if "data" in data and "result" in data["data"]:
                ws_result = data["data"]["result"]
                for ws_block in ws_result.get("ws", []):
                    for cw in ws_block.get("cw", []):
                        result_text += cw.get("w", "")

            # ✅ 结束标志
            if data.get("data", {}).get("status") == 2:
                print("🟢 识别结束。")
                break

        ws.close()
        print("✅ 最终识别结果：", result_text.strip() or "(空结果)")
        return result_text.strip()

    except Exception as e:
        print("❌ WebSocket异常：", traceback.format_exc())
        return ""