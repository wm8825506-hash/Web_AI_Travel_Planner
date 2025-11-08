// src/components/TripMap.jsx
import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// 为不同类型的地点创建不同的图标
const createIcon = (type) => {
  // 根据类型设置不同的图标颜色或样式
  let iconColor = 'red'; // 默认红色
  if (type === '景点') iconColor = 'red';
  if (type === '住宿') iconColor = 'blue';
  if (type === '交通') iconColor = 'green';
  if (type === '餐饮') iconColor = 'orange';

  return L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

/* ✅ 用于更新地图中心点 */
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center)) {
      map.setView(center, 12, { animate: true });
    }
  }, [center, map]); // 添加 map 依赖以消除 ESLint 警告，虽然实际上不是必需的
  return null;
}

export default function TripMap({ plan, selectedDay }) {
  const [points, setPoints] = useState([]);

  // ✅ 每次选中日期变化时重新计算点集
  useEffect(() => {
    if (!plan || !plan.plan) return;
    const dayItems = selectedDay ? plan.plan[selectedDay] : Object.values(plan.plan).flat();
    const locs = (dayItems || []).filter((i) => i.location);
    setPoints(locs);
  }, [plan, selectedDay]);

  // ✅ 计算地图中心点
  const center = useMemo(() => {
    if (points.length > 0) {
      const { lat, lng } = points[0].location;
      return [lat, lng];
    }
    return [35.6895, 139.6917]; // 默认东京
  }, [points]);

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3>
        🗺️{" "}
        {selectedDay
          ? `第 ${selectedDay.replace("day_", "")} 天行程地图`
          : "整趟旅行总览地图"}
      </h3>

      <MapContainer
        key={selectedDay || "all"} // ✅ 强制重渲染
        center={center}
        zoom={12}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* 自动更新视图中心 */}
        <MapUpdater center={center} />

        {/* ✅ 景点标记 */}
        {points.map((p, i) => (
          <Marker 
            key={i} 
            position={[p.location.lat, p.location.lng]}
            icon={createIcon(p.type)}
          >
            <Popup>
              <strong>{p.name}</strong>
              <br />
              {p.type} — {p.time || ""}
              <br />
              💴 {p.estimated_cost || 0} 日元
              {p.note && (
                <>
                  <br />
                  📝 {p.note}
                </>
              )}
            </Popup>
          </Marker>
        ))}

        {/* ✅ 绘制路线连线 */}
        {points.length > 1 && (
          <Polyline
            positions={points.map((p) => [p.location.lat, p.location.lng])}
            color="#007BFF"
            weight={3}
          />
        )}
      </MapContainer>
    </div>
  );
}