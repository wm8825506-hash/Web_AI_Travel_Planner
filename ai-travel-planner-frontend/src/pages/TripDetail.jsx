// src/pages/TripDetail.jsx
import React, { useEffect, useState, useCallback } from "react";
import TripMap from "../components/TripMap";
import TripDayCard from "../components/TripDayCard";
import ExpenseRecorder from "../components/ExpenseRecorder";

export default function TripDetail({ planId, onBack, username }) {
  const [plan, setPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [resetTrigger, setResetTrigger] = useState(0); // 用于重置ExpenseRecorder的触发器

  const fetchDetail = useCallback(async () => {
    const res = await fetch(`http://127.0.0.1:8000/plan/${planId}`);
    const data = await res.json();
    if (data.success) {
      // 处理可能存在的控制字符
      const processedData = {
        ...data.data,
        destination: data.data.destination?.replace(/\x00/g, '') || data.data.destination,
        summary: data.data.summary?.replace(/\x00/g, '') || data.data.summary,
        personalized_tips: data.data.personalized_tips?.map(tip => tip.replace(/\x00/g, '')) || data.data.personalized_tips
      };
      setPlan(processedData);
    }
  }, [planId]);

  useEffect(() => {
    if (planId) {
      fetchDetail();
      setResetTrigger(prev => prev + 1); // 触发ExpenseRecorder重置
    }
  }, [planId, fetchDetail]);

  useEffect(() => {
    // 默认选中第一天
    if (plan && plan.plan) {
      const firstDay = Object.keys(plan.plan)[0];
      setSelectedDay(firstDay);
    }
  }, [plan]);

  if (!plan) return null;

  // 兼容数据结构
  const data = {
    destination: plan.destination,
    days: plan.days,
    summary: plan.summary,
    plan: plan.plan || {},
    daily_budget: plan.daily_budget || [],
    budget: plan.budget || {},
    personalized_tips: plan.personalized_tips || [],
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>← 返回</button>
        <h2 style={styles.title}>{data.destination}（{data.days}天）</h2>
      </div>
      <div style={styles.content}>
        <p style={styles.summary}>{data.summary}</p>

        {/* 三栏布局：行程列表(左) + 地图(中) + 支出记录和个性化建议(右) */}
        <div style={styles.detailColumns}>
          {/* 左侧列：每日行程卡片 */}
          <div style={styles.leftDetailColumn}>
            <div style={styles.section}>
              <h3>行程安排</h3>
              <div style={styles.tripCardsContainer}>
                {Object.entries(data.plan || {}).map(([day, activities], idx) => (
                  <TripDayCard
                    key={day}
                    day={day}
                    index={idx}
                    activities={activities}
                    dayBudget={(data.daily_budget || [])[idx]?.estimated_total}
                    isActive={selectedDay === day}
                    onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* 中间列：地图 */}
          <div style={styles.middleColumn}>
            <div style={styles.section}>
              <TripMap plan={data.plan} selectedDay={selectedDay} />
            </div>
          </div>
          
          {/* 右侧列：支出记录和个性化建议 */}
          <div style={styles.rightDetailColumn}>
            {/* 支出记录 */}
            <div style={styles.section}>
              <ExpenseRecorder 
                planId={planId} 
                username={username} 
                resetTrigger={resetTrigger} // 传递重置触发器
              />
            </div>
            
            {/* 个性化建议 */}
            {data.personalized_tips && data.personalized_tips.length > 0 && (
              <div style={styles.section}>
                <h3>💡 个性化建议</h3>
                <ul style={styles.tipsList}>
                  {data.personalized_tips.map((tip, i) => (
                    <li key={i} style={styles.tipItem}>{tip.replace(/\x00/g, '')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "100%",
    margin: "0 auto",
    padding: "20px 0",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
  },
  backButton: {
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: "500",
  },
  title: {
    margin: 0,
    color: "#333",
  },
  content: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    padding: "20px",
  },
  summary: {
    color: "#555",
    fontSize: "16px",
    lineHeight: "1.6",
    marginBottom: "30px",
  },
  section: {
    marginBottom: "30px",
  },
  detailColumns: {
    display: "flex",
    gap: "20px",
  },
  leftDetailColumn: {
    width: "350px", // 扩大每日行程模块宽度
  },
  middleColumn: {
    width: "500px", // 缩小地图宽度
  },
  rightDetailColumn: {
    width: "300px", // 保持右侧栏宽度
  },
  tripCardsContainer: {
    maxHeight: "calc(100vh - 200px)", // 限制容器最大高度
    overflowY: "auto", // 添加滚动条
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