# app/routers/expense.py
import io
import datetime
from fastapi import APIRouter, UploadFile, File, Form
from app.services.speech_recognizer import xfyun_speech_to_text
from app.services.ai_expense_parser import parse_expense_text
from app.db import supabase
from app.schemas.budget import BudgetRecordCreate
from app.services.supabase_client import add_expense, list_expenses
import os
import traceback

router = APIRouter(tags=["Expense"])

# 🎤 上传语音并自动识别支出类别与金额
@router.post("/voice-add")
async def add_expense_voice(
    username: str = Form(...),
    plan_id: str = Form(...),
    file: UploadFile = File(...),
):
    temp_path = None
    wav_path = None
    
    try:
        # 创建临时目录
        temp_dir = os.path.join(os.getcwd(), "temp")
        os.makedirs(temp_dir, exist_ok=True)

        # 保存上传文件
        temp_path = os.path.join(temp_dir, file.filename)
        file_content = await file.read()
        
        if not file_content:
            return {"success": False, "error": "上传的文件为空"}
            
        print(f"📥 接收到费用语音文件: {file.filename}, 大小: {len(file_content)} 字节")
        
        with open(temp_path, "wb") as f:
            f.write(file_content)

        # 转换为 16kHz 单声道 PCM WAV
        wav_path = os.path.splitext(temp_path)[0] + ".wav"
        try:
            print(f"🔄 开始转换费用音频: {temp_path} -> {wav_path}")
            from pydub import AudioSegment
            sound = AudioSegment.from_file(temp_path)
            sound = sound.set_frame_rate(16000).set_channels(1).set_sample_width(2)
            sound.export(wav_path, format="wav")
            print("🎧 导出费用音频:", wav_path)
            
            # 检查转换后的文件
            if os.path.exists(wav_path):
                wav_size = os.path.getsize(wav_path)
                print(f"✅ WAV文件大小: {wav_size} 字节")
                if wav_size == 0:
                    return {"success": False, "error": "转换后的音频文件为空"}
            else:
                return {"success": False, "error": "音频转换失败，文件未生成"}
        except Exception as e:
            print("❌ 费用音频转换失败：", traceback.format_exc())
            return {"success": False, "error": f"音频转换失败: {str(e)}"}

        # 1️⃣ 语音识别
        if not os.path.exists(wav_path):
            return {"success": False, "error": "音频转换后文件不存在"}
            
        print(f"🚀 调用讯飞语音识别费用信息: {wav_path}")
        text = xfyun_speech_to_text(wav_path)
        print("🗣️ 费用语音识别结果：", text)

        # 2️⃣ 通义解析类别和金额
        parsed = parse_expense_text(text)
        if not parsed.get("success"):
            return {"success": False, "error": "无法识别支出结构"}

        category = parsed["category"]
        amount = parsed["amount"]

        # 3️⃣ 存入数据库 (使用统一的supabase_client)
        add_expense(username, plan_id, category, amount, text)

        return {
            "success": True,
            "data": {"category": category, "amount": amount, "text": text},
        }
    except Exception as e:
        print("❌ 费用语音识别异常：", traceback.format_exc())
        return {"success": False, "error": str(e)}
    finally:
        # 清理临时文件
        try:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
                print(f"🧹 清理费用临时文件: {temp_path}")
            if wav_path and os.path.exists(wav_path):
                os.remove(wav_path)
                print(f"🧹 清理费用临时文件: {wav_path}")
        except Exception as e:
            print("⚠️ 清理费用临时文件失败：", e)


# 🤖 自动分类支出描述
@router.post("/auto-categorize")
async def auto_categorize_expense(expense: dict):
    """
    根据支出描述自动分类类别和金额
    """
    try:
        text = expense.get("text", "")
        if not text:
            return {"success": False, "error": "缺少描述文本"}
            
        # 使用AI解析支出类别和金额
        parsed = parse_expense_text(text)
        if not parsed.get("success"):
            return {"success": False, "error": "无法识别支出结构"}
            
        return {
            "success": True,
            "category": parsed["category"],
            "amount": parsed["amount"]
        }
    except Exception as e:
        print("❌ 自动分类支出异常：", traceback.format_exc())
        return {"success": False, "error": str(e)}


# 💾 导出 PDF 支出报告
@router.get("/report/{plan_id}")
def export_report(plan_id: str):
    try:
        # 从Supabase获取数据 (使用统一的supabase_client)
        records = list_expenses(plan_id)

        if not records:
            return {"success": False, "error": "暂无支出记录"}

        # 统计数据
        summary = {}
        total = 0
        for r in records:
            category = r["category"]
            amount = r["amount"]
            summary[category] = summary.get(category, 0) + amount
            total += amount

        # 生成 PDF
        # Note: FPDF import was missing, adding it here
        from fpdf import FPDF
        
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", "B", 16)
        pdf.cell(200, 10, txt="旅行支出报告", ln=True, align="C")
        pdf.ln(8)
        pdf.set_font("Arial", size=12)
        pdf.cell(200, 10, txt=f"行程 ID: {plan_id}", ln=True)
        pdf.cell(200, 10, txt=f"总支出: {total:.2f} 元", ln=True)
        pdf.ln(6)

        pdf.cell(200, 10, txt="分类汇总：", ln=True)
        for cat, amt in summary.items():
            pdf.cell(200, 8, txt=f"- {cat}: {amt:.2f} 元", ln=True)

        pdf.ln(8)
        pdf.cell(200, 10, txt="详细记录：", ln=True)
        for r in records:
            created_at = r.get("created_at")
            if created_at:
                # 处理不同格式的时间戳
                try:
                    if isinstance(created_at, str):
                        if 'T' in created_at:
                            created_at = datetime.datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        else:
                            created_at = datetime.datetime.fromtimestamp(float(created_at)/1000)
                    else:
                        created_at = datetime.datetime.fromtimestamp(float(created_at)/1000)
                except:
                    created_at = datetime.datetime.now()
            else:
                created_at = datetime.datetime.now()
                
            description = f" ({r['description']})" if r.get('description') else ""
            pdf.cell(
                200,
                8,
                txt=f"{created_at.strftime('%Y-%m-%d %H:%M')} | {r['category']} | {r['amount']} 元{description}",
                ln=True,
            )

        pdf_output = io.BytesIO()
        pdf.output(pdf_output)
        pdf_output.seek(0)

        return {
            "success": True,
            "summary": summary,
            "total": total,
            "report_link": f"http://127.0.0.1:8000/files/{plan_id}_report.pdf",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# 获取指定行程的费用列表
@router.get("/list/{plan_id}")
def get_expense_list(plan_id: str):
    try:
        records = list_expenses(plan_id)
        return {"success": True, "data": records}
    except Exception as e:
        return {"success": False, "error": str(e)}