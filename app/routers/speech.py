# app/routers/speech.py
from fastapi import APIRouter, UploadFile, File
from app.services.speech_recognizer import xfyun_speech_to_text
import os
from pydub import AudioSegment
import traceback

router = APIRouter(prefix="/speech", tags=["Speech"])


@router.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    """
    接收前端上传的音频文件并调用讯飞语音识别
    """
    try:
        # ✅ 创建临时目录（Windows/Linux通用）
        temp_dir = os.path.join(os.getcwd(), "temp")
        os.makedirs(temp_dir, exist_ok=True)

        # ✅ 保存上传文件（如 audio.webm）
        temp_path = os.path.join(temp_dir, file.filename)
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        # ✅ 转换为 16kHz 单声道 PCM WAV
        wav_path = os.path.splitext(temp_path)[0] + ".wav"
        sound = AudioSegment.from_file(temp_path)
        sound = sound.set_frame_rate(16000).set_channels(1).set_sample_width(2)
        sound.export(wav_path, format="wav")
        print("🎧 导出音频:", wav_path)
        print("🎧 音频时长:", len(sound) / 1000, "秒")

        # ✅ 调用讯飞语音识别接口（传入 wav 文件）
        result_text = xfyun_speech_to_text(wav_path)

        # ✅ 清理临时文件
        try:
            os.remove(temp_path)
            os.remove(wav_path)
        except Exception:
            pass  # 不影响主流程

        return {"success": True, "text": result_text}

    except Exception as e:
        print("❌ 语音识别异常：", traceback.format_exc())
        return {"success": False, "error": str(e)}
