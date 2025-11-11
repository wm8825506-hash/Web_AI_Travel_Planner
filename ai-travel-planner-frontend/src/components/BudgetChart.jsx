// src/components/BudgetChart.jsx
import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#4CAF50", "#FF9800", "#2196F3", "#E91E63", "#9C27B0"];

export default function BudgetChart({ budget }) {
  if (!budget) return null;

  const budgetData = Object.entries(budget)
    .filter(([k]) => typeof budget[k] === "number" && k !== "total")
    .map(([k, v]) => ({ name: k, value: v }));

  return (
    <div style={styles.chartBox}>
      <h3>💵 费用分布</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={budgetData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {budgetData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <p style={styles.totalBudget}>💰 总预算：<strong>{budget.total}</strong> 元</p>
    </div>
  );
}

const styles = {
  chartBox: {
    marginTop: "30px",
    padding: "15px",
    background: "#f9f9f9",
    borderRadius: "10px",
  },
  totalBudget: {
    textAlign: "center",
    fontSize: "1.2em",
    fontWeight: "bold",
    marginTop: "15px",
    padding: "10px",
    background: "#fff",
    borderRadius: "5px",
    border: "1px solid #eee"
  }
};