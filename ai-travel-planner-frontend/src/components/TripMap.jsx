// src/components/TripMap.jsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// 修复Leaflet默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function TripMap({ plan, selectedDay }) {
  const [points, setPoints] = useState([]);
  const mapRef = useRef(null);
  const refreshTimerRef = useRef(null);

  // ✅ 每次选中日期变化时重新计算点集
  useEffect(() => {
    if (!plan || !plan.plan) return;
    const dayItems = selectedDay ? plan.plan[selectedDay] : Object.values(plan.plan).flat();

    // 提取普通地点
    const locs = (dayItems || []).filter((i) => i.location);
    setPoints(locs);
  }, [plan, selectedDay]);

  // ✅ 计算地图中心点
  const center = useMemo(() => {
    if (points.length > 0) {
      // 计算所有点的中心
      const latSum = points.reduce((sum, p) => sum + p.location.lat, 0);
      const lngSum = points.reduce((sum, p) => sum + p.location.lng, 0);
      return [latSum / points.length, lngSum / points.length];
    }
    return [35.6895, 139.6917]; // 默认东京
  }, [points]);

  // ✅ 计算当天行程路线（连接所有地点）
  const dayRoute = useMemo(() => {
    if (points.length > 1) {
      return points.map(p => [p.location.lat, p.location.lng]);
    }
    return [];
  }, [points]);

  // 处理地图标记点的导航功能
  const handleMarkerNavigation = (point) => {
    if (point.location) {
      const { lat, lng } = point.location;
      // 构建高德地图导航链接
      const gaodeNavUrl = `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(point.name)}&mode=car`;
      window.open(gaodeNavUrl, '_blank');
    }
  };

  // 强制刷新地图的函数
  const forceRefreshMap = useCallback((mapInstance, delay = 0) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      if (mapInstance) {
        try {
          // 强制刷新地图尺寸
          mapInstance.invalidateSize();

          // 确保瓦片图层可见
          const mapContainer = mapInstance.getContainer();
          const tileLayers = mapContainer.querySelectorAll('.leaflet-tile-container');
          tileLayers.forEach(layer => {
            layer.style.visibility = 'visible';
            layer.style.opacity = '1';
            layer.style.transform = 'translate3d(0, 0, 0)'; // 触发硬件加速
          });

          // 如果有点数据，调整视图
          if (points.length > 0) {
            const markers = points.map(p => L.marker([p.location.lat, p.location.lng]));
            if (markers.length > 0) {
              const group = L.featureGroup(markers);
              const bounds = group.getBounds().pad(0.15); // 增加padding确保所有点可见
              mapInstance.fitBounds(bounds, {
                animate: false
              });
            }
          }
        } catch (error) {
          console.warn("地图刷新出错:", error);
        }
      }
    }, delay);
  }, [points]);

  // 当地图创建时的回调
  const handleMapWhenCreated = useCallback((map) => {
    mapRef.current = map;

    // 立即执行刷新
    forceRefreshMap(map, 10);

    // 延迟执行多次刷新确保地图正确显示
    forceRefreshMap(map, 100);
    forceRefreshMap(map, 300);
    forceRefreshMap(map, 600);

    // 添加地图事件监听器
    const handleMoveEnd = () => {
      setTimeout(() => forceRefreshMap(map, 10), 10);
    };

    const handleZoomEnd = () => {
      setTimeout(() => forceRefreshMap(map, 10), 10);
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleZoomEnd);

    // 清理函数
    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleZoomEnd);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [forceRefreshMap]);

  // 当点数据变化时刷新地图
  useEffect(() => {
    if (mapRef.current) {
      forceRefreshMap(mapRef.current, 10);
      forceRefreshMap(mapRef.current, 100);
    }
  }, [points, forceRefreshMap]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        forceRefreshMap(mapRef.current, 10);
        forceRefreshMap(mapRef.current, 100);
        forceRefreshMap(mapRef.current, 300);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [forceRefreshMap]);

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3>
        🗺️{" "}
        {selectedDay
          ? `第 ${selectedDay.replace("day_", "")} 天行程地图`
          : "整趟旅行总览地图"}
      </h3>

      <div style={{
        height: "500px",
        width: "100%",
        position: "relative",
        border: "1px solid #ddd",
        borderRadius: "4px",
        overflow: "hidden"
      }}>
        <MapContainer
          key={`${selectedDay || "all"}-${points.length}`} // 确保关键点变化时重新渲染
          center={center}
          zoom={12}
          style={{
            height: "100%",
            width: "100%",
            background: "#f0f0f0"
          }}
          whenCreated={handleMapWhenCreated}
          zoomAnimation={true}
          fadeAnimation={false} // 禁用淡入动画减少渲染问题
          markerZoomAnimation={true}
        >
          <TileLayer
            // url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            url="https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            keepBuffer={3}
            updateWhenIdle={false}
            updateWhenZooming={true}
            zIndex={1}
          />

          {/* ✅ 景点标记 */}
          {points.map((p, i) => (
            <Marker
              key={i}
              position={[p.location.lat, p.location.lng]}
            >
              <Popup>
                <div style={{ position: 'relative', minWidth: '200px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', paddingRight: '20px' }}>
                    {p.name}
                  </div>
                  {p.location && (
                    <div style={{ position: 'absolute', top: '0', right: '0' }}>
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkerNavigation(p);
                        }}
                        style={{
                          color: '#007BFF',
                          fontSize: '1.1em',
                          cursor: 'pointer',
                          display: 'inline-block',
                          padding: '4px'
                        }}
                        title="去这儿"
                      >
                        ↗️
                      </span>
                    </div>
                  )}
                  <div style={{ fontSize: '0.9em' }}>
                    <div>{p.type} — {p.time || ""}</div>
                    <div>💰 {p.estimated_cost || 0} 元</div>
                    {p.note && (
                      <div style={{ marginTop: '5px', fontStyle: 'italic' }}>
                        💡 {p.note}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ✅ 绘制当天行程路线（连接所有地点） */}
          {dayRoute.length > 1 && (
            <Polyline
              positions={dayRoute}
              color="#007BFF"
              weight={3}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}