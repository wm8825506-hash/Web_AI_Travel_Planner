// src/pages/BudgetManagement.jsx
import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import VoiceExpenseInput from "../components/VoiceExpenseInput";

const COLORS = ["#4CAF50", "#FF9800", "#2196F3", "#E91E63", "#9C27B0", "#795548"];
const CATEGORIES = [ "交通", "住宿", "餐饮", "门票", "购物", "其他"];

// 创建一个颜色映射函数，确保相同类别使用相同颜色
const getColorForCategory = (category) => {
  const index = CATEGORIES.indexOf(category);
  if (index !== -1) {
    return COLORS[index % COLORS.length];
  }
  // 如果类别不在预定义列表中，使用默认颜色
  return "#CCCCCC";
};

export default function BudgetManagement({ user }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [actualExpenses, setActualExpenses] = useState({});
  const [input, setInput] = useState({ category: "", amount: "", description: "" });
  const [editingId, setEditingId] = useState(null); // 用于跟踪正在编辑的记录ID
  const [saving, setSaving] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [isExpenseListExpanded, setIsExpenseListExpanded] = useState(true); // 控制支出明细折叠状态
  const [, setResetTrigger] = useState(0); // 用于重置ExpenseRecorder的触发器

  // 获取用户的所有行程
  useEffect(() => {
    const fetchPlans = async () => {
      if (!user) return;
      
      try {
        const res = await fetch(`http://127.0.0.1:8000/plan/list?user=${user}`);
        const data = await res.json();
        if (data.success) {
          const processedPlans = (data.data || []).map(plan => ({
            ...plan,
            id: plan.id || plan.plan_id,  // 确保id字段存在
            destination: plan.destination,
            summary: plan.summary
          }));
          setPlans(processedPlans);
          
          // 默认选择第一个行程
          if (processedPlans.length > 0 && !selectedPlan) {
            handlePlanSelect(processedPlans[0]);
          }
        }
      } catch (error) {
        console.error("获取行程列表失败:", error);
      }
    };

    fetchPlans();
  }, [user, selectedPlan]);

  // 处理行程选择
  const handlePlanSelect = async (plan) => {
    // 确保plan对象包含有效的id字段
    const validPlan = {
      ...plan,
      id: plan.id || plan.plan_id
    };
    
    if (!validPlan.id) {
      console.error("Plan does not have a valid id:", plan);
      alert("选择的行程缺少ID信息");
      return;
    }
    
    setSelectedPlan(validPlan);
    setResetTrigger(prev => prev + 1); // 触发ExpenseRecorder重置
    setEditingId(null); // 重置编辑状态
    setInput({ category: "", amount: "", description: "" }); // 重置输入表单
    
    // 获取实际支出数据
    try {
      const res = await fetch(`http://127.0.0.1:8000/budget/summary/${validPlan.id}`);
      const data = await res.json();
      if (data.success) {
        // 构建按类别汇总的实际支出数据
        const summary = {};
        (data.items || []).forEach(item => {
          if (summary[item.category]) {
            summary[item.category] += item.amount;
          } else {
            summary[item.category] = item.amount;
          }
        });
        
        setActualExpenses(summary);
        setBudgetData({
          ai: validPlan.budget,
          actual: summary,
          total: data.total || 0,
          items: data.items || []
        });
      }
    } catch (error) {
      console.error("获取预算数据失败:", error);
    }
  };

  // =============== 添加支出记录 ===============
  const handleAdd = async () => {
    if (!selectedPlan) {
      alert("请先选择一个行程");
      return;
    }

    // 添加额外的检查确保 selectedPlan.id 存在
    if (!selectedPlan.id) {
      console.error("Selected plan does not have an id:", selectedPlan);
      alert("所选行程缺少ID信息");
      return;
    }

    const category = input.category.trim();
    const amount = parseFloat(input.amount);
    if (!category || isNaN(amount) || amount <= 0) {
      alert("请选择类别并输入有效金额");
      return;
    }

    setSaving(true);

    // 准备发送到后端的数据
    const requestData = {
      user: user || "guest",
      plan_id: selectedPlan.id,
      category,
      amount,
    };
    
    // 如果有描述，则添加到请求数据中
    if (input.description.trim()) {
      requestData.description = input.description.trim();
    }
    
    console.log("Sending request data:", requestData);
    
    // 添加额外检查确保所有必需字段都存在
    if (!requestData.plan_id) {
      console.error("Missing plan_id in request data");
      alert("行程ID缺失，无法添加支出记录");
      setSaving(false);
      return;
    }
    
    const response = await fetch("http://127.0.0.1:8000/budget/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to add expense:", errorData);
      alert(`添加支出记录失败: ${errorData.detail || "未知错误"}`);
    }
    setSaving(false);
    setInput({ category: "", amount: "", description: "" });
    
    // 重新加载数据
    handlePlanSelect(selectedPlan);
  };

  // =============== 开始编辑支出记录 ===============
  const handleEdit = (item) => {
    setInput({
      category: item.category,
      amount: item.amount.toString(),
      description: item.description || ""
    });
    setEditingId(item.id);
  };

  // =============== 保存编辑的支出记录 ===============
  const handleSaveEdit = async () => {
    if (!selectedPlan) {
      alert("请先选择一个行程");
      return;
    }

    if (!editingId) {
      alert("未选择要编辑的记录");
      return;
    }

    const category = input.category.trim();
    const amount = parseFloat(input.amount);
    if (!category || isNaN(amount) || amount <= 0) {
      alert("请选择类别并输入有效金额");
      return;
    }

    setSaving(true);

    try {
      // 发送更新请求到后端
      const response = await fetch("http://127.0.0.1:8000/budget/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          user: user || "guest",
          plan_id: selectedPlan.id,
          category,
          amount,
          description: input.description.trim() || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "未知错误");
      }

      // 重置编辑状态和表单
      setEditingId(null);
      setInput({ category: "", amount: "", description: "" });
      
      // 重新加载数据
      handlePlanSelect(selectedPlan);
    } catch (error) {
      console.error("更新支出记录失败:", error);
      alert(`更新支出记录失败: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // =============== 删除支出记录 ===============
  const handleDelete = async (itemId) => {
    if (!itemId) {
      alert("未选择要删除的记录");
      return;
    }

    if (!window.confirm("确定要删除这条支出记录吗？")) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/budget/delete/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "未知错误");
      }

      // 重新加载数据
      handlePlanSelect(selectedPlan);
    } catch (error) {
      console.error("删除支出记录失败:", error);
      alert(`删除支出记录失败: ${error.message}`);
    }
  };

  // =============== 取消编辑 ===============
  const handleCancelEdit = () => {
    setEditingId(null);
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
    
    // 由于后端在expense/voice-add中已经自动保存到数据库，这里只需要刷新列表
    // 重新加载数据
    handlePlanSelect(selectedPlan);
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

  // =============== 数据构建 ===============
  const aiBudgetData = budgetData?.ai ? 
    Object.entries(budgetData.ai)
      .filter(([k]) => typeof budgetData.ai[k] === "number" && k !== "total")
      .map(([k, v]) => ({ name: k, value: v })) : [];

  const actualData = Object.entries(actualExpenses).map(([k, v]) => ({
    name: k,
    value: v,
  }));

  const totalActual = Object.values(actualExpenses).reduce((a, b) => a + b, 0);

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h3>💰 预算管理</h3>
          <p>请登录以查看和管理您的预算。</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        {/* 左侧：行程选择 */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <h3 >🧳 我的行程</h3>
            {plans.length === 0 ? (
              <p>暂无行程数据</p>
            ) : (
              <div style={styles.planList}>
                {plans.map((plan) => (
                  <div 
                    key={plan.id} 
                    style={{
                      ...styles.planItem,
                      ...(selectedPlan && selectedPlan.id === plan.id ? styles.selectedPlanItem : {})
                    }}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    <div style={styles.planItemTitle}>
                      {plan.summary || plan.destination || '无标题'}
                    </div>
                    <div style={styles.planItemDetails}>
                      {plan.destination || '未知目的地'} · {plan.days || 0}天
                    </div>
                    <div style={styles.planItemDate}>
                      {plan.created_at ? new Date(plan.created_at).toLocaleString() : '未知时间'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：预算详情 */}
        <div style={styles.rightColumn}>
          {selectedPlan ? (
            <div style={styles.resultSection}>
              {/* 行程信息 */}
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>📅 {selectedPlan.summary || '无标题'} - {selectedPlan.destination || '未知目的地'}</h3>
                <p>创建时间: {selectedPlan.created_at ? new Date(selectedPlan.created_at).toLocaleString() : '未知时间'}</p>
              </div>

              {/* 添加/编辑支出 */}
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>{editingId ? "✏️ 编辑支出记录" : "➕ 添加支出记录"}</h3>
                <div style={styles.inputSection}>
                  <div style={styles.inputRow}>
                    <select
                      value={input.category}
                      onChange={(e) => setInput({ ...input, category: e.target.value })}
                      style={styles.categorySelect}
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
                        onMouseEnter={(e) => e.target.style.background = styles.autoButtonHover.background}
                        onMouseLeave={(e) => e.target.style.background = styles.autoButton.background}
                      >
                        {autoDetecting ? "识别中..." : "自动识别"}
                      </button>
                    </div>
                  </div>
                  
                  <div style={styles.buttonRow}>
                    <div style={styles.buttonGroup}>
                      {editingId ? (
                        <>
                          <button 
                            onClick={handleSaveEdit} 
                            disabled={saving} 
                            style={styles.addButton}
                            onMouseEnter={(e) => e.target.style.background = styles.addButtonHover.background}
                            onMouseLeave={(e) => e.target.style.background = styles.addButton.background}
                          >
                            {saving ? "保存中..." : "保存"}
                          </button>
                          <button 
                            onClick={handleCancelEdit} 
                            disabled={saving} 
                            style={{...styles.addButton, background: "#6c757d"}}
                            onMouseEnter={(e) => e.target.style.background = "#5a6268"}
                            onMouseLeave={(e) => e.target.style.background = "#6c757d"}
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={handleAdd} 
                          disabled={saving} 
                          style={styles.addButton}
                          onMouseEnter={(e) => e.target.style.background = styles.addButtonHover.background}
                          onMouseLeave={(e) => e.target.style.background = styles.addButton.background}
                        >
                          {saving ? "保存中..." : "添加支出"}
                        </button>
                      )}
                      <div style={styles.voiceInputContainer}>
                        <VoiceExpenseInput 
                          username={user} 
                          planId={selectedPlan.id} 
                          onResult={handleVoiceExpense} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 预算图表和支出明细并排显示 */}
              <div style={styles.chartAndExpenseContainer}>
                {/* 预算图表 */}
                <div style={styles.chartSection}>
                  <div style={styles.card}>
                    <h3 style={styles.sectionTitle}>📊 预算对比</h3>
                    <div style={styles.chartContainer}>
                      {/* 左：AI预算 */}
                      <div style={styles.chartBox}>
                        <h4 style={styles.chartTitle}>🧠 AI 预估预算</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={aiBudgetData}
                              dataKey="value"
                              nameKey="name"
                              outerRadius={80}
                              label
                            >
                              {aiBudgetData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getColorForCategory(entry.name)} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                        <p style={styles.total}>总预算：{budgetData?.ai?.total || 0} 元</p>
                      </div>

                      {/* 右：实际支出 */}
                      <div style={styles.chartBox}>
                        <h4 style={styles.chartTitle}>💵 实际支出</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={actualData}
                              dataKey="value"
                              nameKey="name"
                              outerRadius={80}
                              label
                            >
                              {actualData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getColorForCategory(entry.name)} />
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
                </div>

                {/* 支出明细 */}
                <div style={styles.expenseSection}>
                  {budgetData?.items && budgetData.items.length > 0 && (
                    <div style={styles.card}>
                      <div 
                        style={styles.expenseListHeader}
                        onClick={() => setIsExpenseListExpanded(!isExpenseListExpanded)}
                      >
                        <h3 style={styles.expenseListTitle}>📋 支出明细</h3>
                        <span style={styles.expandIndicator}>
                          {isExpenseListExpanded ? '▲ 收起' : '▼ 展开'}
                        </span>
                      </div>
                      {isExpenseListExpanded && (
                        <div style={styles.expenseList}>
                          {budgetData.items.map((item, index) => (
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
                              <div style={styles.expenseActions}>
                                <button 
                                  onClick={() => handleEdit(item)}
                                  style={{...styles.actionButton, background: "#abd7ef", color: "#000"}}
                                >
                                  编辑
                                </button>
                                <button 
                                  onClick={() => handleDelete(item.id)}
                                  style={{...styles.actionButton, background: "#ef8c98"}}
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>📋 预算详情</h3>
              <p style={styles.placeholderText}>
                请从左侧选择一个行程以查看和管理其预算信息。
              </p>
              <div style={styles.placeholderIllustration}>
                <span style={styles.emoji}>🧾</span>
                <span style={styles.emoji}>💰</span>
                <span style={styles.emoji}>📊</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 🎨 样式
const styles = {
  container: {
    fontFamily: "Segoe UI, sans-serif",
    margin: "0 auto",
    padding: "0px",
  },
  contentWrapper: {
    display: "flex",
    gap: "20px",
    flexDirection: "row",
  },
  leftColumn: {
    flex: 1,
    minWidth: "300px",
  },
  rightColumn: {
    flex: 3,
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    padding: "20px",
    marginBottom: "10px",
    border: "1px solid #eee",
  },
  sectionTitle: {
    color: "#333",
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "10px",
    paddingBottom: "1px",
  },
  planList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  planItem: {
    padding: "15px",
    border: "1px solid #eee",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
    backgroundColor: "#fafafa",
  },
  selectedPlanItem: {
    border: "2px solid #007BFF",
    backgroundColor: "#f0f8ff",
    boxShadow: "0 2px 8px rgba(0,123,255,0.2)",
  },
  planItemTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "6px",
  },
  planItemDetails: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "4px",
  },
  planItemDate: {
    fontSize: "12px",
    color: "#999",
  },
  inputSection: {
    marginBottom: "20px",
  },
  inputRow: {
    display: "flex",
    gap: "15px",
    marginBottom: "15px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  descriptionRow: {
    marginBottom: "15px",
  },
  descriptionContainer: {
    position: "relative",
    flex: 1,
    display: "flex",
    alignItems: "center",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
  },
  buttonGroup: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  categorySelect: {
    width: "160px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  amountInput: {
    width: "120px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  descriptionInput: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  autoButton: {
    position: "absolute",
    right: "5px",
    background: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "12px",
    transition: "background 0.2s",
  },
  autoButtonHover: {
    background: "#218838",
  },
  addButton: {
    background: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background 0.2s",
  },
  addButtonHover: {
    background: "#0069d9",
  },
  voiceInputContainer: {
    display: "inline-block",
  },
  chartAndExpenseContainer: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  chartSection: {
    flex: 2,
    minWidth: "500px",
  },
  expenseSection: {
    flex: 1,
    minWidth: "300px",
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
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  chartTitle: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "10px",
    color: "#333",
  },
  total: {
    textAlign: "center",
    fontWeight: "bold",
    marginTop: "10px",
    fontSize: "16px",
    color: "#050505",
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
  expenseListHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    padding: "12px",
    background: "#f5f5f5",
    borderRadius: "5px",
    marginBottom: "10px",
  },
  expenseListTitle: {
    margin: 0,
    color: "#333",
    fontSize: "16px",
    fontWeight: "600",
  },
  expandIndicator: {
    color: "#007BFF",
    fontWeight: "bold",
  },
  expenseList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  expenseItem: {
    padding: "15px",
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
    fontSize: "18px",
  },
  expenseDescription: {
    color: "#666",
    marginBottom: "5px",
    fontSize: "14px",
  },
  expenseDate: {
    color: "#999",
    fontSize: "12px",
    marginBottom: "10px",
  },
  expenseActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: "5px 10px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
  },
};