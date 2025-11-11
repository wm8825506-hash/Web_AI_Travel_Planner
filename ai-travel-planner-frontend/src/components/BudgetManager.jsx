// src/components/BudgetManager.jsx
import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import VoiceExpenseInput from "./VoiceExpenseInput";

const COLORS = ["#4CAF50", "#FF9800", "#2196F3", "#E91E63", "#9C27B0"];
const CATEGORIES = ["餐饮", "交通", "门票", "住宿", "购物", "其他"];

export default function BudgetManager({ budget, planId, username }) {
  const [actuals, setActuals] = useState({});
  const [input, setInput] = useState({ category: "", amount: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);

  // 获取实际支出数据
  useEffect(() => {
    const fetchActualExpenses = async () => {
      if (!planId) return;
      
      try {
        const res = await fetch(`http://127.0.0.1:8000/budget/summary/${planId}`);
        const data = await res.json();
        if (data.success) {
          setActuals(data.summary || {});
        }
      } catch (error) {
        console.error("获取实际支出数据失败:", error);
      }
    };

    fetchActualExpenses();
  }, [planId]);

  if (!budget) return null;

  // =============== 数据构建 ===============
  const aiBudgetData = Object.entries(budget)
    .filter(([k]) => typeof budget[k] === "number" && k !== "total")
    .map(([k, v]) => ({ name: k, value: v }));

  const actualData = Object.entries(actuals).map(([k, v]) => ({
    name: k,
    value: v,
  }));

  const totalActual = Object.values(actuals).reduce((a, b) => a + b, 0);

  // =============== 添加支出记录 ===============
  const handleAdd = async () => {
    const category = input.category.trim();
    const amount = parseFloat(input.amount);
    if (!category || isNaN(amount) || amount <= 0) {
      alert("请选择类别并输入有效金额");
      return;
    }

    const newActuals = { ...actuals, [category]: (actuals[category] || 0) + amount };
    setActuals(newActuals);
    setSaving(true);

    // 准备发送到后端的数据
    const requestData = {
      username: username || "guest",
      plan_id: planId || "temp",
      category,
      amount,
    };
    
    // 如果有描述，则添加到请求数据中
    if (input.description.trim()) {
      requestData.description = input.description.trim();
    }

    await fetch("http://127.0.0.1:8000/budget/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });
    setSaving(false);
    setInput({ category: "", amount: "", description: "" });
  };

  // =============== 语音支出回调 ===============
  const handleVoiceExpense = (item) => {
    if (!item) return;
    
    // 设置描述字段为语音识别的结果
    const newInput = { 
      category: item.category || input.category,
      amount: item.amount || input.amount,
      description: item.text || input.description
    };
    
    setInput(newInput);
    
    // 如果语音识别返回了类别和金额，则自动更新实际支出
    if (item.category && item.amount) {
      setActuals((prev) => ({
        ...prev,
        [item.category]: (prev[item.category] || 0) + item.amount,
      }));
    }
  };

  // =============== 自动分类和金额识别 ===============
  const handleAutoCategorize = async () => {
    if (!input.description.trim()) {
      alert("请先输入描述");
      return;
    }

    setAutoDetecting(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/expense/auto-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.description }),
      });
      
      const data = await response.json();
      if (data.success) {
        setInput({
          ...input,
          category: data.category,
          amount: data.amount.toString()
        });
      } else {
        alert("自动分类失败: " + data.error);
      }
    } catch (error) {
      console.error("自动分类错误:", error);
      alert("自动分类过程中发生错误");
    } finally {
      setAutoDetecting(false);
    }
  };

  // =============== 描述输入变化处理 ===============
  const handleDescriptionChange = (e) => {
    const newDescription = e.target.value;
    setInput({ ...input, description: newDescription });
  };

  // =============== 渲染 ===============
  return (
    <div style={styles.box}>
      {/* 添加支出 */}
      <div style={styles.inputSection}>
        <div style={styles.inputRow}>
          <select
            value={input.category}
            onChange={(e) => setInput({ ...input, category: e.target.value })}
            style={styles.select}
          >
            <option value="">选择类别</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="金额（元）"
            value={input.amount}
            onChange={(e) => setInput({ ...input, amount: e.target.value })}
            style={styles.amountInput}
          />
        </div>
        
        <div style={styles.descriptionRow}>
          <div style={styles.descriptionContainer}>
            <input
              type="text"
              placeholder="可选描述（例如：在某某餐厅用餐）"
              value={input.description}
              onChange={handleDescriptionChange}
              style={styles.descriptionInput}
            />
            <button 
              onClick={handleAutoCategorize} 
              disabled={autoDetecting || !input.description.trim()}
              style={styles.autoButton}
            >
              {autoDetecting ? "识别中..." : "自动识别"}
            </button>
          </div>
        </div>
        
        <div style={styles.buttonRow}>
          <div style={styles.buttonGroup}>
            <button onClick={handleAdd} disabled={saving} style={styles.addButton}>
              {saving ? "保存中..." : "添加支出"}
            </button>
            <div style={styles.voiceInputContainer}>
              <VoiceExpenseInput username={username} planId={planId} onResult={handleVoiceExpense} />
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div style={styles.chartContainer}>
        {/* 左：AI预算 */}
        <div style={styles.chartBox}>
          <h4>🧠 AI 预估预算</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={aiBudgetData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label
              >
                {aiBudgetData.map((e, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p style={styles.total}>总预算：{budget.total} 元</p>
        </div>

        {/* 右：实际支出 */}
        <div style={styles.chartBox}>
          <h4>💵 实际支出</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={actualData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label
              >
                {actualData.map((e, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p style={styles.total}>当前总支出：{totalActual} 元</p>
        </div>
      </div>
    </div>
  );
}

// =============== 样式 ===============
const styles = {
  box: {
    marginTop: "20px",
  },
  inputSection: {
    marginBottom: "20px",
    padding: "15px",
    background: "#fff",
    borderRadius: "8px",
    border: "1px solid #eee",
  },
  inputRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },
  descriptionRow: {
    marginBottom: "15px",
  },
  descriptionContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  select: {
    flex: 1,
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  amountInput: {
    width: "120px",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  descriptionInput: {
    flex: 1,
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  autoButton: {
    position: "absolute",
    right: "5px",
    background: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: "12px",
  },
  addButton: {
    background: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    cursor: "pointer",
  },
  voiceInputContainer: {
    display: "inline-block",
  },
  chartContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  chartBox: {
    background: "#fff",
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid #eee",
  },
  total: {
    textAlign: "center",
    fontWeight: "bold",
    marginTop: "10px",
  },
  diffList: {
    listStyle: "none",
    padding: "0",
    marginTop: "15px",
  },
};