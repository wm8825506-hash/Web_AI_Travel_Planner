// src/pages/Home.js
import React, { useState, useRef } from "react";
import SpeechInput from "../components/SpeechInput";
import PlanForm from "../components/PlanForm";
import { createPlan } from "../api";

import TripMap from "../components/TripMap";
import TripDayCard from "../components/TripDayCard";

const Home = ({ username }) => {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null); // ✅ 当前选中的行程天数
  const [inputMode, setInputMode] = useState("text"); // "text" | "form"
  const formRef = useRef(); // 用于访问表单的引用

  const handleRecognized = (text) => setQuery(text);

  const handleGenerate = async () => {
    let prompt = query;
    
    // 如果是表单模式，需要先获取表单数据
    if (inputMode === "form") {
      // 通过表单引用获取表单数据
      if (formRef.current) {
        const data = formRef.current.getFormData();
        
        // 检查是否有填写内容
        if (!data.destination && !data.days && !data.budget && !data.people && !data.preferences) {
          return alert("请至少填写一项表单内容！");
        }
        
        // 将表单数据转换为自然语言提示
        const promptParts = [];
        
        if (data.destination) promptParts.push(`去${data.destination}`);
        
        if (data.days) promptParts.push(`玩${data.days}天`);
        
        if (data.budget) promptParts.push(`预算${data.budget}元`);
        
        if (data.people) {
          promptParts.push(`${data.people}个人`);
        }
        
        if (data.preferences) promptParts.push(`喜欢${data.preferences}`);
        
        prompt = promptParts.join("，");
        setQuery(prompt);
      } else {
        return alert("请至少填写一项表单内容！");
      }
    } else {
      // 文本或语音模式
      if (!prompt.trim()) return alert("请输入或语音输入旅行需求！");
    }
    
    setLoading(true);
    setPlan(null);
    setSelectedDay(null); // 清除之前的选择
    try {
      // const res = await createPlan({ query: prompt });
      const res = await createPlan({ query: prompt, user:username });
      if (res.success) {
        // 处理可能存在的控制字符
        const processedData = {
          ...res.data,
          destination: res.data.destination?.replace(/\x00/g, '') || res.data.destination,
          summary: res.data.summary?.replace(/\x00/g, '') || res.data.summary,
          personalized_tips: res.data.personalized_tips?.map(tip => tip.replace(/\x00/g, '')) || res.data.personalized_tips
        };
        
        setPlan(processedData);
        // 默认选中第一天
        if (processedData.plan) {
          const firstDay = Object.keys(processedData.plan)[0];
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
      <h2 style={styles.pageTitle}>创建新行程</h2>
      
      <div style={styles.contentWrapper}>
        {/* 左侧：输入区 */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <h3>🎤 输入旅行需求</h3>
            
            {/* 输入模式切换 */}
            <div style={styles.modeToggle}>
              <button 
                style={inputMode === "text" ? styles.activeModeButton : styles.modeButton}
                onClick={() => setInputMode("text")}
              >
                文本或语音输入
              </button>
              <button 
                style={inputMode === "form" ? styles.activeModeButton : styles.modeButton}
                onClick={() => setInputMode("form")}
              >
                表单输入
              </button>
            </div>

            {inputMode === "text" ? (
              <>
                <div style={styles.inputContainer}>
                  <textarea
                    placeholder="例如：我想去日本玩5天，预算8000元，喜欢温泉和美食，带孩子。"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={styles.textarea}
                  />
                  <SpeechInput onRecognized={handleRecognized} />
                </div>
              </>
            ) : (
              <PlanForm ref={formRef} />
            )}
            
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
          
          {/* 个性化建议展示区 */}
          {plan && plan.personalized_tips && (
            <div style={styles.card}>
              <h3>💡 个性化建议</h3>
              <ul style={styles.tipsList}>
                {plan.personalized_tips.map((tip, i) => (
                  <li key={i} style={styles.tipItem}>{tip.replace(/\x00/g, '')}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 右侧：AI 行程规划结果展示 */}
        <div style={styles.rightColumn}>
          {plan ? (
            <div style={styles.resultSection}>
              <div style={styles.card}>
                <h3>📅 {plan.summary}-{plan.destination}</h3>
                
                {/* 地图模块：根据选中日期高亮当天路线 */}}
                <TripMap plan={plan} selectedDay={selectedDay} />
              </div>
              
              {/* 每日行程卡片：点击切换地图显示 */}
              <div style={styles.card}>
                <h3>🗓 行程安排</h3>
                {Object.entries(plan.plan || {}).map(([day, activities], idx) => (
                  <TripDayCard
                    key={day}
                    day={day}
                    index={idx}
                    activities={activities}
                    dayBudget={(plan.daily_budget || [])[idx]?.estimated_total}
                    isActive={selectedDay === day}
                    onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.card}>
              <h3>📋 行程预览</h3>
              <p style={styles.placeholderText}>
                在左侧输入您的旅行需求并生成行程后，行程详情将在此处显示。
              </p>
              <div style={styles.placeholderIllustration}>
                <span style={styles.emoji}>🧳</span>
                <span style={styles.emoji}>🗺️</span>
                <span style={styles.emoji}>📅</span>
                <span style={styles.emoji}>💰</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 🎨 样式
const styles = {
  container: {
    fontFamily: "Segoe UI, sans-serif",
  },
  pageTitle: {
    color: "#007BFF",
    fontWeight: "bold",
    marginBottom: "20px",
    textAlign: "center",
  },
  contentWrapper: {
    display: "flex",
    gap: "20px",
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    padding: "20px",
    marginBottom: "20px",
  },
  modeToggle: {
    display: "flex",
    marginBottom: "15px",
    gap: "10px"
  },
  modeButton: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#f0f0f0",
    border: "1px solid #ccc",
    borderRadius: "5px",
    cursor: "pointer"
  },
  activeModeButton: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#007BFF",
    color: "white",
    border: "1px solid #007BFF",
    borderRadius: "5px",
    cursor: "pointer"
  },
  inputContainer: {
    position: "relative",
    width: "100%",
    marginTop: "15px",
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    padding: "12px 50px 12px 12px", // 右侧留出空间给语音按钮
    fontSize: "15px",
    resize: "vertical",
    boxSizing: "border-box",
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
    width: "100%",
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
  resultSection: {
    // 右侧结果区域样式
  },
  placeholderText: {
    color: "#666",
    textAlign: "center",
    marginTop: "20px",
  },
  placeholderIllustration: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "30px",
    fontSize: "40px",
  },
  emoji: {
    opacity: 0.7,
  },
  tipsList: {
    margin: 0,
    paddingLeft: "20px",
  },
  tipItem: {
    marginBottom: "10px",
    lineHeight: "1.5",
  },
};

export default Home;