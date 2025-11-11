// src/components/VoiceExpenseInput.jsx
import React, { useState, useRef } from "react";

const VoiceExpenseInput = ({ username, planId, onResult }) => {
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState("");
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
    setMessage(""); // 清除之前的消息
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setRecording(false);
  };

  const handleStop = async () => {
    const blob = new Blob(audioChunks.current, { type: "audio/wav" });
    const formData = new FormData();
    formData.append("file", blob, "expense.wav");
    formData.append("username", username);
    formData.append("plan_id", planId);

    setMessage("🎤 正在识别并保存支出信息...");
    
    const res = await fetch("http://127.0.0.1:8000/expense/voice-add", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      setMessage(`✅ 支出已保存: ${data.data.category}: ${data.data.amount}元`);
      // 传递完整的数据对象，包括原始文本
      if (onResult) onResult(data.data);
    } else {
      setMessage("❌ 语音识别失败: " + (data.error || "未知错误"));
    }
  };

  return (
    <div style={styles.box}>
      <button onClick={recording ? stopRecording : startRecording} style={styles.button}>
        {recording ? "🛑 停止录音" : "🎤 语音录入支出"}
      </button>
      <p>{message}</p>
    </div>
  );
};

const styles = {
  box: { marginTop: "15px" },
  button: {
    background: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    cursor: "pointer",
  },
};

export default VoiceExpenseInput;