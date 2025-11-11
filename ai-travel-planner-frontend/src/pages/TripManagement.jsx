// src/pages/TripManagement.jsx
import React, { useState, useRef, useEffect } from "react";
import SpeechInput from "../components/SpeechInput";
import PlanForm from "../components/PlanForm";
import { createPlan } from "../api";
import TripMap from "../components/TripMap";
import TripDayCard from "../components/TripDayCard";
import ExpenseRecorder from "../components/ExpenseRecorder";

const TripManagement = ({ username }) => {
  const [query, setQuery] = useState("");
  const [plans, setPlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [inputMode, setInputMode] = useState("text");
  const [activeTab, setActiveTab] = useState("create"); // "create" | "list"
  const [resetTrigger, setResetTrigger] = useState(0); // 用于重置ExpenseRecorder的触发器
  const formRef = useRef();

  // 获取用户的所有行程
  useEffect(() => {
    const fetchPlans = async () => {
      if (!username) return;
      
      try {
        const res = await fetch(`http://127.0.0.1:8000/plan/list?user=${username}`);
        const data = await res.json();
        if (data.success) {
          const processedPlans = (data.data || []).map(plan => ({
            ...plan,
            destination: plan.destination?.replace(/\x00/g, '') || plan.destination,
            summary: plan.summary?.replace(/\x00/g, '') || plan.summary
          }));
          setPlans(processedPlans);
        }
      } catch (error) {
        console.error("获取行程列表失败:", error);
      }
    };

    fetchPlans();
  }, [username]);

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
    setSelectedDay(null);
    setResetTrigger(prev => prev + 1); // 触发ExpenseRecorder重置
    try {
      const res = await createPlan({ query: prompt, user: username });
      if (res.success) {
        setPlan(res.data);
        // 默认选中第一天
        if (res.data.plan) {
          const firstDay = Object.keys(res.data.plan)[0];
          setSelectedDay(firstDay);
        }
      } else {
        let errorMsg = "AI 生成行程失败，请稍后重试。";
        if (res.raw_data) {
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

  // 查看行程详情
  const handleViewPlan = (selectedPlan) => {
    setPlan(selectedPlan);
    setActiveTab("detail");
    setResetTrigger(prev => prev + 1); // 触发ExpenseRecorder重置
    // 默认选中第一天
    if (selectedPlan.plan) {
      const firstDay = Object.keys(selectedPlan.plan)[0];
      setSelectedDay(firstDay);
    }
  };

  // 切换选项卡时重置ExpenseRecorder
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResetTrigger(prev => prev + 1); // 触发ExpenseRecorder重置
  };

  return (
    <div style={styles.container}>
      {/*<h2 style={styles.pageTitle}>行程管理</h2>*/}
      
      <div style={styles.contentWrapper}>
        {/* 最左侧：行程创建和列表 */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <div style={styles.tabHeader}>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "create" ? styles.activeTabButton : {})
                }}
                onClick={() => handleTabChange("create")}
              >
                创建行程
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "list" ? styles.activeTabButton : {})
                }}
                onClick={() => handleTabChange("list")}
              >
                我的行程
              </button>
            </div>

            {activeTab === "create" ? (
              <div style={styles.tabContent}>
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
            ) : (
              <div style={styles.tabContent}>
                <h3>🧳 我的行程</h3>
                {plans.length === 0 ? (
                  <p>暂无行程数据</p>
                ) : (
                  <div style={styles.planList}>
                    {plans.map((p) => (
                      <div 
                        key={p.id} 
                        style={styles.planItem}
                        onClick={() => handleViewPlan(p)}
                      >
                        <div style={{ fontSize: 16, fontWeight: 600 }}>
                          {p.summary?.replace(/\x00/g, '') || p.destination?.replace(/\x00/g, '') || '无标题'}
                        </div>
                        <div style={{ color: "#666", marginTop: 6 }}>
                          {p.destination?.replace(/\x00/g, '') || '未知目的地'} · {p.days || 0}天
                        </div>
                        <div style={{ color: "#999", marginTop: 4 }}>
                          {p.created_at ? new Date(p.created_at).toLocaleString() : '未知时间'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：行程详情展示 */}
        <div style={styles.rightColumn}>
          {plan ? (
            <div style={styles.resultSection}>
              {/* 行程概览 */}
              <div style={styles.card}>
                <h3>📅 {plan.summary}-{plan.destination}</h3>
              </div>
              
              {/* 三栏布局：行程列表(左) + 地图(中) + 个性化建议和支出记录(右) */}
              <div style={styles.detailColumns}>
                {/* 左侧列：每日行程卡片 */}
                <div style={styles.leftDetailColumn}>
                  <div style={styles.card}>
                    <h3>🗓 行程安排</h3>
                    {Object.entries(plan.plan || {}).map(([day, activities], idx) => (
                      <div style={styles.dayCardWrapper} key={day}>
                        <TripDayCard
                        day={day}
                        index={idx}
                        activities={activities}
                        dayBudget={(plan.daily_budget || [])[idx]?.estimated_total}
                        isActive={selectedDay === day}
                        onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                      />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 中间列：地图 */}
                <div style={styles.middleColumn}>
                  <div style={styles.card}>
                    <TripMap plan={plan} selectedDay={selectedDay} />
                  </div>
                </div>
                
                {/* 右侧列：支出记录和个性化建议 */}
                <div style={styles.rightDetailColumn}>
                  {/* 支出记录 */}
                  <div>
                    <ExpenseRecorder 
                      planId={plan.id} 
                      username={username} 
                      resetTrigger={resetTrigger} // 传递重置触发器
                    />
                  </div>
                  
                  {/*/!* 个性化建议 *!/*/}
                  {/*{plan.personalized_tips && plan.personalized_tips.length > 0 && (*/}
                  {/*  <div style={styles.card}>*/}
                  {/*    <h3>💡 个性化建议</h3>*/}
                  {/*    <ul style={styles.tipsList}>*/}
                  {/*      {plan.personalized_tips.map((tip, i) => (*/}
                  {/*        <li key={i} style={styles.tipItem}>{tip}</li>*/}
                  {/*      ))}*/}
                  {/*    </ul>*/}
                  {/*  </div>*/}
                  {/*)}*/}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.card}>
              <h3>📋 行程详情</h3>
              <p style={styles.placeholderText}>
                {activeTab === "create" 
                  ? "在左侧输入您的旅行需求并生成行程后，行程详情将在此处显示。" 
                  : "从左侧的行程列表中选择一个行程以查看详细信息。"}
              </p>
              <div style={styles.placeholderIllustration}>
                <span style={styles.emoji}>🧳</span>
                <span style={styles.emoji}>🗺️</span>
                <span style={styles.emoji}>📅</span>
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
    width: "100%",
  },
  // pageTitle: {
  //   color: "#007BFF",
  //   fontWeight: "bold",
  //   marginBottom: "20px",
  //   textAlign: "center",
  // },
  contentWrapper: {
    display: "flex",
    gap: "15px",
  },
  leftColumn: {
    width: "350px", // 固定宽度
  },
  rightColumn: {
    flex: 1,
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    padding: "15px",
    marginBottom: "10px",
  },
  tabHeader: {
    display: "flex",
    borderBottom: "1px solid #eee",
    marginBottom: "20px",
  },
  tabButton: {
    flex: 1,
    padding: "8px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    fontWeight: "500",
  },
  activeTabButton: {
    borderBottom: "2px solid #007BFF",
    color: "#007BFF",
  },
  tabContent: {
    // 选项卡内容样式
  },
  modeToggle: {
    display: "flex",
    marginBottom: "15px",
    gap: "10px"
  },
  modeButton: {
    flex: 1,
    padding: "8px",
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
    marginTop: "10px",
  },
  textarea: {
    width: "100%",
    minHeight: "200px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    padding: "10px 50px 10px 10px",
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
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "12px",
    width: "100%",
  },
  spinner: {
    display: "inline-block",
    width: "16px",
    height: "20px",
    marginRight: "8px",
    border: "2px solid #fff",
    borderRadius: "50%",
    borderTopColor: "transparent",
    animation: "spin 0.8s linear infinite",
  },
  planList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  planItem: {
    padding: "12px",
    border: "1px solid #eee",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  resultSection: {
    // 右侧结果区域样式
  },
  detailColumns: {
    display: "flex",
    gap: "20px",
  },
  leftDetailColumn: {
    width: "420px", //
  },
  middleColumn: {
    flex: 1, // 让地图自适应宽度
  },
  rightDetailColumn: {
    width: "430px", // 保持右侧栏宽度
  },
  dayCardsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    maxHeight: "800px",
    overflowY: "auto",
    paddingRight: "10px",
  },
  dayCardWrapper: {
    flex: "0 0 auto",
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

export default TripManagement;