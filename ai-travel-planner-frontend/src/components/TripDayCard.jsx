// src/components/TripDayCard.jsx
import React from "react";

export default function TripDayCard({ day, index, activities, dayBudget }) {
  const transportList = activities.filter((a) => a.type === "交通");

  return (
    <div style={styles.dayBox}>
      <h3>{`📆 第 ${index + 1} 天行程`}</h3>

      {activities.map((a, i) => (
        <p key={i}>
          <strong>{a.type}：</strong>{" "}
          {a.type === "交通" && a.name?.includes("→") ? `🚗 ${a.name}` : a.name}
          {a.time ? `（${a.time}）` : ""} — 💴 {a.estimated_cost || 0} 元
        </p>
      ))}

      {transportList.length > 0 && (
        <div style={styles.transportBox}>
          <h4>🚆 今日交通路线：</h4>
          {transportList.map((t, i) => (
            <p key={i}>{t.name?.includes("→") ? `🧭 ${t.name}` : `🧭 ${t.detail}`}</p>
          ))}
        </div>
      )}

      <div style={styles.budgetBox}>
        💰 <strong>预计当日总开销：</strong> {dayBudget || 0} 元
      </div>
    </div>
  );
}

const styles = {
  dayBox: {
    border: "1px solid #eee",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "20px",
    background: "#fafafa",
  },
  transportBox: {
    background: "#eaf2f8",
    padding: "10px",
    borderRadius: "6px",
    marginTop: "10px",
  },
  budgetBox: {
    background: "#fef5e7",
    padding: "10px",
    borderRadius: "6px",
    marginTop: "10px",
  },
};
