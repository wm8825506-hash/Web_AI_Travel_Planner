import React, { useState } from "react";
import { register, login } from "../api";

const AuthForm = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (isRegister) {
        // 使用邮箱作为用户名
        const data = await register(username, password);
        setMessage(`🎉 注册成功：${data.username}`);
      } else {
        const data = await login(username, password);
        setMessage(data.message);
        // 使用登录返回的用户名
        const loggedInUsername = data.message.match(/User (.+) logged in successfully/)?.[1] || username;
        onLoginSuccess?.(loggedInUsername);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isRegister ? "注册新账号" : "登录账户"}</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="邮箱"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
          />

          <input
            type="password"
            placeholder="密码（最多 72 个字符）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            {isRegister ? "注册 ✨" : "登录 🚀"}
          </button>
        </form>

        <p style={styles.switchText}>
          {isRegister ? "已有账号？" : "还没有账号？"}{" "}
          <span
            style={styles.link}
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage("");
              setError("");
            }}
          >
            {isRegister ? "去登录" : "去注册"}
          </span>
        </p>

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>⚠️ {error}</p>}
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #e3f2fd, #ffffff)",
    fontFamily: "Segoe UI, sans-serif",
  },
  card: {
    width: "380px",
    backgroundColor: "#fff",
    padding: "40px 30px",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  title: {
    color: "#007BFF",
    marginBottom: "25px",
    fontWeight: "600",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px",
    outline: "none",
    transition: "0.3s",
  },
  button: {
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
    marginTop: "10px",
    transition: "0.3s",
  },
  switchText: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#555",
  },
  link: {
    color: "#007BFF",
    cursor: "pointer",
    fontWeight: "500",
  },
  success: { color: "green", marginTop: "15px" },
  error: { color: "red", marginTop: "15px" },
};

export default AuthForm;