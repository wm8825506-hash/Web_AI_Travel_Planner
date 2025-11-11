// src/App.js
import React, { useState, useEffect } from "react";
import AuthForm from "./components/AuthForm";
import TripManagement from "./pages/TripManagement";
import TripDetail from "./pages/TripDetail";
import BudgetManagement from "./pages/BudgetManagement";
import Layout from "./components/Layout";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [view, setView] = useState("home"); // home | detail | budget
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (storedLoggedIn && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
  }, []);

  const handleLoginSuccess = (username) => {
    setIsLoggedIn(true);
    setUsername(username);
    localStorage.setItem("username", username);
    localStorage.setItem("isLoggedIn", "true");
    // 登录成功后默认显示首页
    setView("home");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setView("home");
    setDetailId(null);
    localStorage.removeItem("username");
    localStorage.removeItem("isLoggedIn");
  };

  // 如果未登录，显示登录/注册页面
  if (!isLoggedIn) {
    return (
      <div>
        <AuthForm onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // 登录后显示主应用界面
  return (
    <Layout 
      username={username} 
      onLogout={handleLogout} 
      onViewChange={setView}
      currentView={view}
    >
      {view === "home" && <TripManagement username={username} />}
      {view === "detail" && detailId && <TripDetail planId={detailId} username={username} onBack={() => { setDetailId(null); setView("home"); }} />}
      {view === "budget" && <BudgetManagement user={username} />}
    </Layout>
  );
}

export default App;