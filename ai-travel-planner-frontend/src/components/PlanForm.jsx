import React, { useState, useEffect } from "react";

const PlanForm = ({ onSubmit, initData }) => {
  const [form, setForm] = useState({
    destination: "",
    days: "",
    budget: "",
    people: "",
    preferences: ""
  });

  useEffect(() => {
    if (initData) setForm((prev) => ({ ...prev, ...initData }));
  }, [initData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.grid}>
        {["destination", "days", "budget", "people", "preferences"].map((key) => (
          <div style={styles.group} key={key}>
            <label style={styles.label}>{labels[key]}</label>
            <input
              name={key}
              value={form[key] || ""}
              onChange={handleChange}
              style={styles.input}
              placeholder={placeholders[key]}
            />
          </div>
        ))}
      </div>
      <button type="submit" style={styles.button}>✨ 生成行程</button>
    </form>
  );
};

const labels = {
  destination: "目的地",
  days: "天数",
  budget: "预算",
  people: "同行人数",
  preferences: "旅行偏好"
};

const placeholders = {
  destination: "如：日本",
  days: "如：5",
  budget: "如：10000",
  people: "如：家庭出行 / 3人",
  preferences: "如：美食、动漫、亲子"
};

const styles = {
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" },
  group: { display: "flex", flexDirection: "column" },
  label: { fontWeight: "bold", marginBottom: "5px" },
  input: { borderRadius: "8px", border: "1px solid #ccc", padding: "8px" },
  button: { marginTop: "10px", background: "#007BFF", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "8px" }
};

export default PlanForm;
