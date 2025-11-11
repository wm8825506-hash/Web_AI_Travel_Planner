import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";

const PlanForm = ({ initData }, ref) => {
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

  // 暴露表单数据给父组件
  useImperativeHandle(ref, () => ({
    getFormData: () => form
  }));

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <form style={styles.form}>
      <div style={styles.grid}>
        {["destination", "days", "budget", "people", "preferences"].map((key) => (
          <div style={styles.group} key={key}>
            <label style={styles.label}>{labels[key]}</label>
            {key === "preferences" ? (
              <textarea
                name={key}
                value={form[key] || ""}
                onChange={handleChange}
                style={styles.textarea}
                placeholder={placeholders[key]}
              />
            ) : (
              <input
                name={key}
                type={key === "days" || key === "budget" || key === "people" ? "number" : "text"}
                value={form[key] || ""}
                onChange={handleChange}
                style={styles.input}
                placeholder={placeholders[key]}
                min={key === "days" || key === "budget" || key === "people" ? "1" : undefined}
              />
            )}
          </div>
        ))}
      </div>
    </form>
  );
};

const labels = {
  destination: "目的地",
  days: "旅行天数",
  budget: "预算 (元)",
  people: "同行人数",
  preferences: "旅行偏好"
};

const placeholders = {
  destination: "如：日本",
  days: "如：5",
  budget: "如：10000",
  people: "如：2",
  preferences: "如：美食、动漫、亲子、自然风光等"
};

const styles = {
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" },
  group: { display: "flex", flexDirection: "column" },
  label: { fontWeight: "bold", marginBottom: "5px" },
  input: { borderRadius: "8px", border: "1px solid #ccc", padding: "8px" },
  textarea: { borderRadius: "8px", border: "1px solid #ccc", padding: "8px", minHeight: "80px", resize: "vertical" }
};

export default forwardRef(PlanForm);