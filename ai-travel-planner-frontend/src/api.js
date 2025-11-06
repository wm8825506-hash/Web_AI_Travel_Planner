const BASE_URL = "http://127.0.0.1:8000/auth";

export const register = async (username, email, password) => {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password: password.slice(0, 72) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "注册失败");
  return data;
};

export const login = async (username, password) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: password.slice(0, 72) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "登录失败");
  return data;
};
// src/api.js
// export const createPlan = async (planData) => {
//   try {
//     const response = await fetch("http://127.0.0.1:8000/plan", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(planData),
//     });
//
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.detail || "生成行程失败");
//     }
//
//     const data = await response.json();
//     return data; // 后端返回 { success: true, data: {...} }
//   } catch (error) {
//     console.error("Error creating plan:", error);
//     return { success: false, error: error.message };
//   }
// };
export async function createPlan(body) {
  try {
    const res = await fetch("http://127.0.0.1:8000/plan/generate", {
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

