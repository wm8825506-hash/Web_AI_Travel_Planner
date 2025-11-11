// src/components/Layout.jsx
import React from "react";

const Layout = ({ children, username, onLogout, onViewChange, currentView }) => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>AI Travel Planner</h1>
        <div style={styles.userSection}>
          <span style={styles.username}>👋 欢迎, {username}</span>
          <nav style={styles.nav}>
            <button 
              onClick={() => onViewChange("home")} 
              style={{
                ...styles.navButton, 
                ...(currentView === "home" ? styles.activeNavButton : {})
              }}
            >
              行程管理
            </button>
            <button 
              onClick={() => onViewChange("budget")} 
              style={{
                ...styles.navButton, 
                ...(currentView === "budget" ? styles.activeNavButton : {})
              }}
            >
              预算管理
            </button>
            <button onClick={onLogout} style={styles.logoutButton}>登出</button>
          </nav>
        </div>
      </header>
      <main style={styles.main}>{children}</main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f4f8ff",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  title: {
    color: "#007BFF",
    fontWeight: "bold",
    margin: 0,
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  username: {
    color: "#333",
    fontWeight: 500,
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  navButton: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  activeNavButton: {
    background: "#007BFF",
    color: "#fff",
    borderColor: "#007BFF",
  },
  logoutButton: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #FF4136",
    background: "#FF4136",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "500",
  },
  main: {
    maxWidth: "100%",
    margin: "0 auto",
    padding: "20px",
  },
};

export default Layout;