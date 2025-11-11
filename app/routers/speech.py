# app/routers/speech.py
from fastapi import APIRouter, UploadFile, File
from app.services.speech_recognizer import xfyun_speech_to_text
import os
import asyncio
import traceback
from pydub import AudioSegment

router = APIRouter(tags=["Speech"])


@router.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    """
    接收前端上传的音频文件并调用讯飞语音识别
    """
    temp_path = None
    wav_path = None
    
    try:
        # ✅ 创建临时目录（Windows/Linux通用）
        temp_dir = os.path.join(os.getcwd(), "temp")
        os.makedirs(temp_dir, exist_ok=True)

        # ✅ 保存上传文件（如 audio.webm）
        temp_path = os.path.join(temp_dir, file.filename)
        file_content = await file.read()
        
        # 检查文件是否为空
        if not file_content:
            return {"success": False, "error": "上传的文件为空"}
            
        print(f"📥 接收到文件: {file.filename}, 大小: {len(file_content)} 字节")
        
        with open(temp_path, "wb") as f:
            f.write(file_content)

        # ✅ 转换为 16kHz 单声道 PCM WAV
        wav_path = os.path.splitext(temp_path)[0] + ".wav"
        try:
            print(f"🔄 开始转换音频: {temp_path} -> {wav_path}")
            sound = AudioSegment.from_file(temp_path)
            sound = sound.set_frame_rate(16000).set_channels(1).set_sample_width(2)
            sound.export(wav_path, format="wav")
            print("🎧 导出音频:", wav_path)
            print("🎧 音频时长:", len(sound) / 1000, "秒")
            
            # 检查转换后的文件
            if os.path.exists(wav_path):
                wav_size = os.path.getsize(wav_path)
                print(f"✅ WAV文件大小: {wav_size} 字节")
                if wav_size == 0:
                    return {"success": False, "error": "转换后的音频文件为空"}
            else:
                return {"success": False, "error": "音频转换失败，文件未生成"}
        except Exception as e:
            print("❌ 音频转换失败：", traceback.format_exc())
            return {"success": False, "error": f"音频转换失败: {str(e)}"}

        # ✅ 调用讯飞语音识别接口（传入 wav 文件）
        if not os.path.exists(wav_path):
            return {"success": False, "error": "音频转换后文件不存在"}
            
        print(f"🚀 调用讯飞语音识别: {wav_path}")
        result_text = xfyun_speech_to_text(wav_path)
        print(f"🎯 识别完成，结果: '{result_text}'")

        return {"success": True, "text": result_text}

    except asyncio.CancelledError:
        # 客户端断开连接或请求被取消
        print("⚠️ 语音识别请求被取消")
        raise  # 重新抛出取消异常，让FastAPI正确处理
        
    except Exception as e:
        print("❌ 语音识别异常：", traceback.format_exc())
        return {"success": False, "error": str(e)}
        
    finally:
        # ✅ 清理临时文件
        try:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
                print(f"🧹 清理临时文件: {temp_path}")
            if wav_path and os.path.exists(wav_path):
                os.remove(wav_path)
                print(f"🧹 清理临时文件: {wav_path}")
        except Exception as e:
            print("⚠️ 清理临时文件失败：", e)