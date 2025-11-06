import React, { useState, useEffect } from "react";
import Home from "./pages/Home";
import AuthForm from "./components/AuthForm";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  // 检查本地存储中的登录状态
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
    // 保存登录状态到本地存储
    localStorage.setItem("username", username);
    localStorage.setItem("isLoggedIn", "true");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    // 清除本地存储的登录状态
    localStorage.removeItem("username");
    localStorage.removeItem("isLoggedIn");
  };

  return (
    <div>
      {isLoggedIn ? (
        <Home username={username} onLogout={handleLogout} />
      ) : (
        <AuthForm onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;