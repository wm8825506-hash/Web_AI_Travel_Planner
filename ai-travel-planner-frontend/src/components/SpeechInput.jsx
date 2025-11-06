import React, { useState, useRef } from "react";

const SpeechInput = ({ onRecognized }) => {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("🎙️ 点击开始语音输入");
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    audioChunks.current = [];
    mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
    mediaRecorder.current.onstop = handleStop;
    mediaRecorder.current.start();
    setRecording(true);
    setStatus("🛑 录音中...点击停止");
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setRecording(false);
  };

  const handleStop = async () => {
    setStatus("⏳ 正在识别中...");
    const blob = new Blob(audioChunks.current, { type: "audio/wav" });
    const formData = new FormData();
    formData.append("file", blob, "speech.wav");

    try {
      const res = await fetch("http://127.0.0.1:8000/speech/speech-to-text", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setStatus("✅ 语音识别成功，可在文本框修改");
        onRecognized(data.text);
      } else {
        setStatus("❌ 语音识别失败");
      }
    } catch (e) {
      setStatus("⚠️ 网络错误");
    }
  };

  return (
    <div style={styles.container}>
      <button
        style={recording ? styles.buttonActive : styles.button}
        onClick={recording ? stopRecording : startRecording}
      >
        {recording ? "停止录音" : "开始录音"}
      </button>
      <p style={styles.status}>{status}</p>
    </div>
  );
};

const styles = {
  container: { textAlign: "center" },
  button: {
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "80px",
    height: "80px",
    cursor: "pointer",
    fontSize: "14px",
  },
  buttonActive: {
    backgroundColor: "#FF4136",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "80px",
    height: "80px",
    cursor: "pointer",
    fontSize: "14px",
  },
  status: { marginTop: "8px", color: "#666" },
};

export default SpeechInput;
