// src/components/ExpenseRecorder.jsx
import React, { useState, useEffect } from "react";
import VoiceExpenseInput from "./VoiceExpenseInput";

const CATEGORIES = ["餐饮", "交通", "门票", "住宿", "购物", "其他"];

export default function ExpenseRecorder({ planId, username, onExpenseAdded, resetTrigger }) {
  const [input, setInput] = useState({ category: "", amount: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [isExpenseListExpanded, setIsExpenseListExpanded] = useState(true); // 控制支出明细折叠状态

  // 获取当前行程的支出记录
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!planId) return;
      
      try {
        const res = await fetch(`/api/budget/summary/${planId}`);
        const data = await res.json();
        if (data.success) {
          setExpenses(data.items || []);
        }
      } catch (error) {
        console.error("获取支出记录失败:", error);
      }
    };

    fetchExpenses();
  }, [planId]);

  // 当resetTrigger变化时，重置表单
  useEffect(() => {
    if (resetTrigger) {
      setInput({ category: "", amount: "", description: "" });
      setExpenses([]);
    }
  }, [resetTrigger]);

  // =============== 添加支出记录 ===============
  const handleAdd = async () => {
    const category = input.category.trim();
    const amount = parseFloat(input.amount);
    if (!category || isNaN(amount) || amount <= 0) {
      alert("请选择类别并输入有效金额");
      return;
    }

    setSaving(true);

    // 准备发送到后端的数据
    const requestData = {
      user: username || "guest",
      plan_id: planId,
      category,
      amount,
    };
    
    // 如果有描述，则添加到请求数据中
    if (input.description.trim()) {
      requestData.description = input.description.trim();
    }

    try {
      await fetch("/api/budget/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      
      // 清空输入并刷新支出列表
      setInput({ category: "", amount: "", description: "" });
      
      // 重新获取支出记录
      const res = await fetch(`/api/budget/summary/${planId}`);
      const data = await res.json();
      if (data.success) {
        setExpenses(data.items || []);
        // 通知父组件有新支出添加
        if (onExpenseAdded) {
          onExpenseAdded(data.summary || {});
        }
      }
    } catch (error) {
      console.error("添加支出记录失败:", error);
      alert("添加支出记录失败");
    } finally {
      setSaving(false);
    }
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
    
    // 由于后端在expense/voice-add中已经自动保存到数据库，这里只需要刷新列表
    // 重新获取支出记录
    fetch(`/api/budget/summary/${planId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExpenses(data.items || []);
          // 通知父组件有新支出添加
          if (onExpenseAdded) {
            onExpenseAdded(data.summary || {});
          }
        }
      })
      .catch(error => {
        console.error("获取支出记录失败:", error);
      });
  };

  // =============== 自动分类和金额识别 ===============
  const handleAutoCategorize = async () => {
    if (!input.description.trim()) {
      alert("请先输入描述");
      return;
    }

    setAutoDetecting(true);
    try {
      const response = await fetch("/api/expense/auto-categorize", {
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

  // 计算总支出
  const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  return (
    <div style={styles.container}>
      <h3 style={{ marginTop: 0 }}>💰 支出记录</h3>
      
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

      {/* 支出统计 */}
      <div style={styles.summary}>
        <p>当前总支出: <strong>¥{totalExpense.toFixed(2)}</strong></p>
      </div>

      {/* 支出明细标题 */}
      {expenses.length > 0 && (
        <div 
          style={styles.expenseListHeader}
          onClick={() => setIsExpenseListExpanded(!isExpenseListExpanded)}
        >
          <h4 style={styles.expenseListTitle}>📋 支出明细</h4>
          <span style={styles.expandIndicator}>
            {isExpenseListExpanded ? '▲ 收起' : '▼ 展开'}
          </span>
        </div>
      )}

      {/* 支出明细 */}
      {expenses.length > 0 && isExpenseListExpanded && (
        <div style={styles.expenseListContainer}>
          <div style={styles.expenseList}>
            {expenses.map((item, index) => (
              <div key={index} style={styles.expenseItem}>
                <div style={styles.expenseHeader}>
                  <span style={styles.expenseCategory}>{item.category}</span>
                  <span style={styles.expenseAmount}>¥{item.amount}</span>
                </div>
                {item.description && (
                  <div style={styles.expenseDescription}>{item.description}</div>
                )}
                <div style={styles.expenseDate}>
                  {item.created_at ? new Date(item.created_at).toLocaleString() : '未知时间'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 样式
const styles = {
  container: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    padding: "20px",
    marginBottom: "20px",
    maxHeight: "800px", // 固定最大高度
    display: "flex",
    flexDirection: "column",
  },
  inputSection: {
    marginBottom: "10px",
    padding: "15px",
    background: "#f9f9f9",
    borderRadius: "8px",
    border: "1px solid #eee",
  },
  inputRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "5px",
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
    gap: "15px",
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
    padding: "5px 16px",
    cursor: "pointer",
  },
  voiceInputContainer: {
    display: "inline-block",
  },
  summary: {
    padding: "4px",
    background: "#e3f2fd",
    borderRadius: "8px",
    textAlign: "center",
    marginBottom: "10px",
  },
  expenseListHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    padding: "10px",
    background: "#f5f5f5",
    borderRadius: "5px",
    marginBottom: "10px",
  },
  expenseListTitle: {
    margin: 0,
    color: "#333",
  },
  expandIndicator: {
    color: "#007BFF",
    fontWeight: "bold",
  },
  expenseListContainer: {
    flex: 1,
    overflowY: "auto", // 允许垂直滚动
    maxHeight: "200px", // 限制明细列表高度
  },
  expenseList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  expenseItem: {
    padding: "10px",
    border: "1px solid #eee",
    borderRadius: "8px",
    backgroundColor: "#fafafa",
  },
  expenseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "5px",
  },
  expenseCategory: {
    fontWeight: "bold",
    color: "#333",
  },
  expenseAmount: {
    fontWeight: "bold",
    color: "#007BFF",
    fontSize: "16px",
  },
  expenseDescription: {
    color: "#666",
    marginBottom: "5px",
    fontSize: "14px",
  },
  expenseDate: {
    color: "#999",
    fontSize: "12px",
  },
};