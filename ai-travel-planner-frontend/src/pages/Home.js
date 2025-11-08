// src/pages/Home.js
import React, { useState } from "react";
import SpeechInput from "../components/SpeechInput";
import { createPlan } from "../api";

import TripMap from "../components/TripMap";
import TripDayCard from "../components/TripDayCard";
import BudgetChart from "../components/BudgetChart";

const Home = ({ username, onLogout }) => {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null); // ✅ 当前选中的行程天数

  const handleRecognized = (text) => setQuery(text);

  const handleGenerate = async () => {
    if (!query.trim()) return alert("请输入或语音输入旅行需求！");
    setLoading(true);
    setPlan(null);
    setSelectedDay(null); // 清除之前的选择
    try {
      const res = await createPlan({ query });
      if (res.success) {
        setPlan(res.data);
        // 默认选中第一天
        if (res.data.plan) {
          const firstDay = Object.keys(res.data.plan)[0];
          setSelectedDay(firstDay);
        }
      } else {
        // 提供更详细的错误信息
        let errorMsg = "AI 生成行程失败，请稍后重试。";
        if (res.raw_data) {
          // 如果有原始数据，显示更多信息帮助调试
          errorMsg += "\n\nAI返回内容格式有误，无法解析为有效的行程数据。";
        }
        if (res.error) {
          errorMsg = res.error;
        }
        alert(errorMsg);
      }
    } catch (err) {
      console.error("❌ 生成行程出错:", err);
      alert("AI 服务调用失败");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      {/* 顶部导航 */}
      <header style={styles.header}>
        <h1 style={styles.title}>AI 旅行规划师 🌏</h1>
        <div>
          <span style={styles.username}>👋 欢迎, {username}</span>
          <button style={styles.logout} onClick={onLogout}>
            登出
          </button>
        </div>
      </header>

      {/* 输入区 */}
      <div style={styles.card}>
        <h2>🎤 语音或文字输入旅行需求</h2>
        <SpeechInput onRecognized={handleRecognized} />
        <textarea
          placeholder="例如：我想去日本玩5天，预算8000元，喜欢温泉和美食，带孩子。"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.textarea}
        />

        {/* ✅ 生成行程按钮 + Loading 动画 */ }
        <button onClick={handleGenerate} style={styles.generateButton} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" style={styles.spinner}></span>
              正在生成中...
            </>
          ) : (
            "🚀 生成AI行程"
          )}
        </button>
      </div>

      {/* AI 行程规划结果展示 */ }
      {plan && (
        <div style={styles.card}>
          <h2>📅 AI 行程规划结果 — {plan.destination}</h2>
          <p style={{ marginBottom: "1rem" }}>{plan.summary}</p>

          {/* ✅ 地图模块：根据选中日期高亮当天路线 */ }
          <TripMap plan={plan} selectedDay={selectedDay} />

          {/* ✅ 每日行程卡片：点击切换地图显示 */ }
          {Object.entries(plan.plan || {}).map(([day, activities], idx) => (
            <div key={day} onClick={() => setSelectedDay(day)} style={{ cursor: "pointer" }}>
              <TripDayCard
                day={day}
                index={idx}
                activities={activities}
                dayBudget={(plan.daily_budget || [])[idx]?.estimated_total}
                active={selectedDay === day}
              />
            </div>
          ))}

          {/* 预算饼图 */ }
          <BudgetChart budget={plan.budget} />

          {/* 个性化建议 */ }
          {plan.personalized_tips && (
            <div style={styles.tipsBox}>
              <h3>💡 个性化建议</h3>
              <ul>
                {plan.personalized_tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 🎨 样式
const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "30px",
    fontFamily: "Segoe UI, sans-serif",
    backgroundColor: "#f4f8ff",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: { color: "#007BFF", fontWeight: "bold" },
  username: { marginRight: "10px", color: "#333", fontWeight: 500 },
  logout: {
    background: "#FF4136",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    cursor: "pointer",
  },
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
    resize: "vertical",
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
  spinner: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    marginRight: "8px",
    border: "2px solid #fff",
    borderRadius: "50%",
    borderTopColor: "transparent",
    animation: "spin 0.8s linear infinite",
  },
  tipsBox: {
    marginTop: "30px",
    background: "#fff3cd",
    padding: "15px",
    borderRadius: "10px",
  },
};

export default Home;