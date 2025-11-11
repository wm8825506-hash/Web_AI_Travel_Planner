import React, { useState, useEffect } from "react";

export default function TripDayCard({ day, index, activities, dayBudget, isActive, onClick }) {
  const [isExpanded, setIsExpanded] = useState(isActive || false);

  // 当isActive属性变化时，同步更新内部状态
  useEffect(() => {
    setIsExpanded(isActive || false);
  }, [isActive]);

  // 重新组织活动列表，将交通信息嵌套到相应的目的地活动下
  const organizeActivities = (activities) => {
    const organized = [];
    let currentTransport = null;
    
    activities.forEach((activity) => {
      if (activity.type === "交通") {
        // 保存当前交通信息，等待下一个非交通活动
        currentTransport = activity;
      } else {
        // 非交通活动，如果之前有交通信息，则组合在一起
        if (currentTransport) {
          organized.push({
            ...activity,
            transport: currentTransport
          });
          currentTransport = null;
        } else {
          // 没有前置交通信息，直接添加活动
          organized.push(activity);
        }
      }
    });
    
    // 处理最后可能剩余的交通信息（如一天结束时的交通）
    if (currentTransport) {
      organized.push({
        type: "结束交通",
        transport: currentTransport
      });
    }
    
    return organized;
  };

  const organizedActivities = organizeActivities(activities);

  // 渲染交通项的函数
  const renderTransport = (transport) => {
    // 处理新的routes格式
    if (transport.routes && Array.isArray(transport.routes)) {
      return (
        <div style={styles.detailGroup}>
          <div style={styles.detailLabel}>交通方式：</div>
          {transport.routes.map((route, idx) => (
            <div key={idx} style={styles.transportRoute}>
              <div style={styles.transportHeader}>
                🚆 {route.from} → {route.to} ({route.mode})
              </div>
              <div style={styles.transportDetails}>
                <span>🕒 {route.time}</span>
                <span>💰 ¥{route.estimated_cost}</span>
              </div>
              <div style={styles.transportDetailText}>{route.detail}</div>
            </div>
          ))}
          {transport.note && (
            <div style={styles.note}>
              💡 {transport.note}
            </div>
          )}
        </div>
      );
    }
    
    // 处理旧格式
    return (
      <div style={styles.detailGroup}>
        <div style={styles.detailLabel}>交通方式：</div>
        <div style={styles.transportRoute}>
          <div style={styles.transportHeader}>
            {transport.name?.includes("→") ? `🚗 ${transport.name}` : transport.name}
          </div>
          <div style={styles.transportDetails}>
            {transport.time && <span>🕒 {transport.time}</span>}
            <span>💰 ¥{transport.estimated_cost || 0}</span>
          </div>
          {/* 展示交通详情信息 */}
          {transport.detail && (
            <div style={styles.transportDetailText}>{transport.detail}</div>
          )}
          {transport.note && (
            <div style={styles.note}>
              💡 {transport.note}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染活动项的函数
  const renderActivity = (activity) => {
    // 特殊处理结束交通
    if (activity.type === "结束交通") {
      return (
        <div key="end-transport" style={{ ...styles.activityItem, borderLeft: "3px solid #888" }}>
          <h4 style={styles.activityHeader}>行程结束交通</h4>
          {renderTransport(activity.transport)}
        </div>
      );
    }

    return (
      <div 
        key={activity.name} 
        style={{ 
          ...styles.activityItem, 
          borderLeft: `3px solid ${getActivityColor(activity.type)}` 
        }}
      >
        {/* 显示活动本身 */}
        <h4 
          style={styles.activityHeader}
          onClick={() => handleActivityClick(activity)}
        >
          {activity.type}：{activity.name}
          {activity.location && (
            <span 
              style={styles.navigationIcon}
              title="去这儿"
            >
              ↗️
            </span>
          )}
        </h4>
        <div style={styles.activityDetails}>
          {/* 按照合理的顺序展示信息：交通 -> 时间 -> 费用 -> 备注 */}
          {activity.transport && renderTransport(activity.transport)}
          
          {activity.time && <div style={styles.detailItem}>🕒 时间：{activity.time}</div>}
          <div style={styles.detailItem}>💰 费用：¥{activity.estimated_cost || 0}</div>
          {activity.note && (
            <div style={styles.note}>
              💡 {activity.note}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 根据活动类型获取颜色
  const getActivityColor = (type) => {
    const colorMap = {
      "景点": "#4CAF50",
      "餐饮": "#FF9800",
      "住宿": "#2196F3",
      "购物": "#9C27B0",
      "娱乐": "#E91E63"
    };
    return colorMap[type] || "#666";
  };

  // 处理活动点击事件，跳转到高德地图导航
  const handleActivityClick = (activity) => {
    if (activity.location) {
      const { lat, lng } = activity.location;
      // 构建高德地图导航链接
      const gaodeNavUrl = `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(activity.name)}&mode=car`;
      window.open(gaodeNavUrl, '_blank');
    }
  };

  // 切换展开/折叠状态
  const toggleExpand = () => {
    // 点击时切换展开状态并通知父组件
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (onClick) {
      onClick(newExpandedState); // 传递新的展开状态
    }
  };

  return (
    <div style={{
      ...styles.dayBox,
      ...(isActive ? styles.activeDayBox : {})
    }}>
      <div 
        style={styles.dayHeader} 
        onClick={toggleExpand}
      >
        <h3 style={styles.dayTitle}>{`第 ${index + 1} 天行程`}</h3>
        <div style={styles.daySummary}>
          <span>{day}</span>
          <span>💰 {dayBudget || 0} 元</span>
          <span style={styles.expandIndicator}>
            {isExpanded ? '▲ 收起' : '▼ 展开'}
          </span>
        </div>
      </div>

      {/* 按顺序展示组织好的活动 */}
      {isExpanded && (
        <div style={styles.activitiesContainer}>
          {organizedActivities.map(renderActivity)}
        </div>
      )}
    </div>
  );
}

const styles = {
  dayBox: {
    border: "1px solid #eee",
    borderRadius: "8px",
    marginBottom: "15px",
    background: "#fafafa",
    overflow: "hidden",
  },
  activeDayBox: {
    border: "2px solid #007BFF",
    boxShadow: "0 2px 8px rgba(0,123,255,0.2)",
  },
  dayHeader: {
    padding: "15px",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayTitle: {
    margin: 0,
    fontSize: "1.2em",
    fontWeight: "bold",
  },
  daySummary: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    color: "#666",
    fontSize: "0.9em",
  },
  expandIndicator: {
    color: "#007BFF",
    fontWeight: "bold",
  },
  activitiesContainer: {
    padding: "0 15px 15px 15px",
    maxHeight: "400px", // 限制最大高度
    overflowY: "auto",  // 添加垂直滚动条
  },
  activityItem: {
    marginBottom: "15px",
    padding: "12px",
    background: "#fff",
    borderRadius: "5px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  activityHeader: {
    margin: "0 0 10px 0",
    fontSize: "1.1em",
    fontWeight: "bold",
    cursor: "pointer"
  },
  navigationIcon: {
    color: "#007BFF",
    fontSize: "1.1em",
    marginLeft: "10px",
    cursor: "pointer",
    display: "inline-block",
    transform: "translateY(2px)"
  },
  activityDetails: {
    marginLeft: "15px"
  },
  detailGroup: {
    marginBottom: "10px",
    padding: "10px",
    background: "#f9f9f9",
    borderRadius: "4px"
  },
  detailLabel: {
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#555"
  },
  detailItem: {
    marginBottom: "5px"
  },
  transportRoute: {
    marginBottom: "10px",
    paddingBottom: "10px",
    borderBottom: "1px dashed #ddd"
  },
  transportHeader: {
    fontWeight: "bold",
    marginBottom: "5px"
  },
  transportDetails: {
    display: "flex",
    gap: "15px",
    fontSize: "0.9em",
    color: "#666",
    marginBottom: "5px"
  },
  transportDetailText: {
    fontSize: "0.9em",
    color: "#666"
  },
  note: {
    fontSize: "0.9em",
    color: "#666",
    marginTop: "5px",
    padding: "8px",
    background: "#fffef7",
    borderRadius: "3px"
  },
  budgetBox: {
    background: "#fef5e7",
    padding: "12px",
    borderRadius: "6px",
    marginTop: "10px",
    fontWeight: "bold"
  },
};