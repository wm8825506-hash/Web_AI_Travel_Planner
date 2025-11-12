# AI 旅行规划师 (AI Travel Planner)

## 项目概述

AI 旅行规划师是一个智能旅行助手应用程序，利用人工智能技术帮助用户规划旅行路线、管理预算和记录支出。该系统能够理解用户的自然语言需求，自动生成个性化的旅行计划，并提供实时的旅行辅助功能。

主要特性：

- AI 自动生成旅行路线和建议
- 语音识别支持，方便快速输入
- 地图集成，可视化旅行路线
- 预算管理和支出跟踪
- 用户认证和行程同步

## 技术架构

### 后端 (FastAPI)

- Python 3.9+
- FastAPI 框架
- Supabase 数据库存储
- 阿里云 DashScope API (Qwen plus模型)
- 科大讯飞语音识别 API

### 前端 (React)

- React 18+
- Leaflet 地图库
- Recharts 图表库
- Supabase JavaScript SDK

### 数据库

- Supabase PostgreSQL

## 功能模块详细介绍

### 1. 用户认证系统

用户可以通过邮箱注册账户并登录系统，实现个性化旅行计划的保存和跨设备同步。

功能特点：

- 用户注册与登录
- 会话状态管理
- 登录状态持久化

### 2. AI 行程规划

系统核心功能，基于用户输入的旅行需求，利用AI技术生成详细的旅行计划。

功能特点：

- 支持文字输入旅行需求
- 支持语音输入旅行需求
- 支持表单输入旅行需求和偏好
- 自动生成个性化旅行计划
- 包含景点、交通、住宿、餐饮等详细信息
- 按天组织行程安排

### 3. 地图导航

集成地图服务，可视化展示旅行路线和景点位置，提供直观的地理信息。

功能特点：

- 景点标记和路线展示
- 交互式地图体验
- 地图与行程信息联动
- 支持高德地图导航跳转
### 4. 预算管理系统

帮助用户规划旅行预算并跟踪实际支出，提供预算与实际花费的对比分析。

功能特点：

- AI 生成预算，预算与实际支出对比图表，支出分类统计
- 实际支出记录支持表单模式、描述框输入文本自动识别类别与金额、语音自动识别三种模式：
  1.选择类别，输入金额，点击“添加支出”
  2.在描述框输入文本，如“我在餐厅吃饭花了50元”，点击自动识别，对识别结果确认或修改后点击“添加支出”
  3.点击“语音录入支出”，识别后会自动保存支出
- 支出记录可编辑或删除

### 5. 行程同步

基于云端存储，实现行程数据的多设备同步，确保用户在任何设备上都能访问自己的旅行计划。

功能特点：

- 云端存储行程数据
- 多设备访问和同步
- 行程列表管理
- 行程详情查看与编辑

## 运行方式

### Docker + Nginx 反向代理部署

本项目支持通过 Docker Compose 进行一键部署，使用 Nginx 作为反向代理服务器。

#### 部署步骤

1. 准备必要文件：
   确保你拥有以下文件，并将它们放在同一个目录下：
   
   - [docker-compose.yml](file:///D:/graduate/AI_Travel_Planner/docker-compose.yml)
   - [.env](file:///D:/graduate/AI_Travel_Planner/.env) (由 [.env.example](file:///D:/graduate/AI_Travel_Planner/.env.example) 复制并修改)

2. 准备环境变量文件：
   复制 [.env.example](file:///D:/graduate/AI_Travel_Planner/.env.example) 文件为 `.env`：
   
   ```bash
   cp .env.example .env
   ```
   
   修改 `.env` 文件中的配置项为生产环境的实际值。

3. 构建并启动服务：
   在包含 [docker-compose.yml](file:///D:/graduate/AI_Travel_Planner/docker-compose.yml) 和 [.env](file:///D:/graduate/AI_Travel_Planner/.env) 文件的目录中执行以下命令：
   
   ```bash
   docker compose pull
   docker compose up -d
   docker compose ps
   ```
   
   此命令将启动以下服务：
   
   - 后端服务 (端口 8000)
   - 前端服务 (端口 3000)，已内置 Nginx

4. 访问应用：
   根据部署环境不同，访问方式也不同：
   
   - 本机部署访问：
     
     - 前端界面: `http://localhost:3000`
     - 后端 API: `http://localhost:8000`
   
   - 服务器部署访问：
     
     - 前端界面: `http://<服务器IP或域名>:3000`
     - 后端 API: `http://<服务器IP或域名>:8000`

#### 服务架构说明

在 Docker 部署环境中：

1. **后端服务**：
   
   - 使用预构建镜像
   - 运行在容器内端口 8000
   - 通过 `/api/health` 端点进行健康检查

2. **前端服务**：
   
   - 使用预构建镜像
   - 内置 Nginx 服务器，监听容器内端口 80
   - 配置了反向代理规则，将 `/api/*` 请求转发至后端服务
   - 前端静态文件通过 Nginx 直接提供服务

3. **网络配置**：
   
   - 前后端服务位于同一个 Docker 网络中
   - 前端通过服务名 `backend` 访问后端 API

#### Nginx 反向代理配置

前端容器内的 [/etc/nginx/conf.d/default.conf](file:///D:/graduate/AI_Travel_Planner/ai-travel-planner-frontend/etc/nginx/conf.d/default.conf) 配置如下：

```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://backend:8000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 5s;
    proxy_send_timeout    60s;
    proxy_read_timeout    60s;
  }
}
```

此配置实现了：

- 静态文件直接由 Nginx 提供服务
- 所有 `/api/` 开头的请求被反向代理到后端服务
- 正确传递客户端 IP 和协议信息
- 设置合理的超时时间

### 本地开发环境

#### 环境要求

- Python 3.9+
- Node.js 16+
- npm 8+

#### 后端启动步骤

1. 克隆项目代码：
   
   ```
   git clone <repository-url>
   cd AI_Travel_Planner
   ```

2. 创建虚拟环境并激活：
   
   ```
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. 安装后端依赖：
   
   ```
   pip install -r requirements.txt
   ```

4. 配置环境变量：
   复制 [.env.example](file:///D:/graduate/AI_Travel_Planner/.env.example) 文件为 `.env` 并填入相应配置：
   
   ```
   cp .env.example .env
   ```
   
   需要配置以下服务的密钥：
   
   - Supabase (数据库)
   - DashScope (AI 模型)
   - 高德地图 API
   - 科大讯飞语音识别 API

5. 启动后端服务：
   
   ```
   python -m uvicorn app.main:app --reload
   ```
   
   默认运行在 `http://localhost:8000`

#### 前端启动步骤

1. 进入前端目录：
   
   ```
   cd ai-travel-planner-frontend
   ```

2. 安装前端依赖：
   
   ```
   npm install
   ```

3. 启动前端开发服务器：
   
   ```
   npm start
   ```
   
   默认运行在 `http://localhost:3000`

4. 访问应用：
   打开浏览器访问 `http://localhost:3000`

## 开发阶段说明

项目按照以下阶段进行开发：

1. 环境与项目初始化
2. 用户管理与认证
3. 语音与文字输入接口
4. AI 行程生成核心
5. 地图导航与交互
6. 费用预算与管理
7. 云端行程同步与多设备支持
8. UI/UX 优化与可视化增强

每个阶段都有明确的目标和功能要求，逐步完善整个系统的功能。

## 目录结构

```
.
├── app/                          # 后端主应用目录
│   ├── models/                   # 数据模型
│   ├── routers/                  # 路由处理
│   ├── schemas/                  # 数据模式定义
│   ├── services/                 # 业务逻辑服务
│   ├── config.py                 # 配置文件
│   ├── db.py                     # 数据库配置
│   ├── dependencies.py           # 依赖项
│   └── main.py                   # 应用入口文件
├── ai-travel-planner-frontend/   # 前端应用目录
│   ├── src/
│   │   ├── components/           # 组件目录
│   │   ├── pages/                # 页面目录
│   │   ├── api.js                # API 接口
│   │   └── App.js                # 主应用组件
│   ├── Dockerfile                # 前端 Docker 配置
│   └── nginx.conf                # Nginx 配置
├── docker-compose.yml            # Docker 编排配置
├── requirements.txt              # 后端依赖列表
└── .env.example                  # 环境变量示例文件
```