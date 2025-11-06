import React, { useState } from "react";
import SpeechInput from "../components/SpeechInput";
import { createPlan } from "../api";

const Home = ({ username, onLogout }) => {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRecognized = (text) => setQuery(text);

  const handleGenerate = async () => {
    if (!query.trim()) return alert("请输入或语音输入旅行需求！");
    setLoading(true);
    const res = await createPlan({ query }); // 直接发送自然语言
    if (res.success) setPlan(res.data);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>AI 旅行规划师 🌏</h1>
        <button style={styles.logout} onClick={onLogout}>登出</button>
      </header>

      <div style={styles.card}>
        <h2>🎤 语音或文字输入旅行需求</h2>
        <SpeechInput onRecognized={handleRecognized} />

        <textarea
          placeholder="例如：我想去日本玩5天，预算8000元，喜欢温泉和美食，带孩子。"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.textarea}
        />

        <button onClick={handleGenerate} style={styles.generateButton}>
          🚀 生成AI行程
        </button>
      </div>

      {loading && <p style={styles.loading}>⏳ 正在生成AI行程...</p>}

      {plan && (
        <div style={styles.card}>
          <h2>📅 AI 行程规划结果</h2>
          {plan.itinerary.map((day, idx) => (
            <div key={idx} style={styles.dayBox}>
              <h3>第 {day.day} 天</h3>
              <p>{day.activity}</p>
              <p><strong>预算：</strong>{day.cost || "——"} 元</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: "900px", margin: "0 auto", padding: "30px", fontFamily: "Segoe UI, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  title: { color: "#007BFF" },
  logout: { background: "#FF4136", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px" },
  card: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    padding: "20px",
    marginBottom: "20px",
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    marginTop: "15px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    padding: "12px",
    fontSize: "15px",
  },
  generateButton: {
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "12px",
  },
  loading: { textAlign: "center", color: "#555" },
  dayBox: {
    background: "#f8faff",
    border: "1px solid #d0e0ff",
    borderRadius: "8px",
    padding: "10px",
    marginBottom: "10px",
  },
};

export default Home;
