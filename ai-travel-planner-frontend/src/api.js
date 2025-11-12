// src/api.js
const API_BASE = "/api";               // 由前端 Nginx 把 /api 反代到 backend:8000/api
const AUTH_BASE = `${API_BASE}/auth`;

export const register = async (username, password) => {
  const res = await fetch(`${AUTH_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: password.slice(0, 72) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "注册失败");
  return data;
};

export const login = async (email, password) => {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username_or_email: email, password: password.slice(0, 72) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "登录失败");
  return data;
};

export async function createPlan(body) {
  try {
    const res = await fetch(`${API_BASE}/plan/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    console.error("createPlan error:", e);
    return { success: false, error: e.message };
  }
}
