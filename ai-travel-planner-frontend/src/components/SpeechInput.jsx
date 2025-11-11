import React, { useState, useRef } from "react";

const SpeechInput = ({ onRecognized }) => {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("");
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = handleStop;
      mediaRecorder.current.start();
      setRecording(true);
      setStatus("🎤 录音中...");
    } catch (err) {
      setStatus("❌ 无法访问麦克风");
      console.error("麦克风访问错误:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      setRecording(false);
      setStatus("⏳ 识别中...");
    }
  };

  const handleStop = async () => {
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
        setStatus("✅ 识别成功");
        onRecognized(data.text);
        // 2秒后清除状态
        setTimeout(() => setStatus(""), 2000);
      } else {
        setStatus("❌ 识别失败");
      }
    } catch (e) {
      setStatus("⚠️ 网络错误");
    }
  };

  return (
    <div style={styles.container}>
      <button
        type="button"
        style={recording ? styles.recordingButton : styles.button}
        onClick={recording ? stopRecording : startRecording}
        title={recording ? "停止录音" : "开始语音输入"}
      >
        🎤
      </button>
      {status && <span style={styles.status}>{status}</span>}
    </div>
  );
};

const styles = {
  container: { 
    display: "flex", 
    alignItems: "center",
    position: "absolute",
    right: "10px",
    top: "10px",
    zIndex: "1"
  },
  button: {
    backgroundColor: "#f0f0f0",
    color: "#666",
    border: "1px solid #ccc",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
  },
  recordingButton: {
    backgroundColor: "#FF4136",
    color: "white",
    border: "1px solid #FF4136",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
  },
  status: { 
    marginLeft: "10px", 
    fontSize: "12px", 
    color: "#666",
    whiteSpace: "nowrap"
  },
};

export default SpeechInput;