# AI 旅行规划师运行指南
重要提醒：为正常使用地图功能，请确保您的网络环境可以访问地图瓦片服务器。国内用户建议使用代理节点或配置网络代理。

本文档详细说明了如何运行 AI 旅行规划师项目，包括 Docker 部署和本地开发环境两种方式。

## 目录

1. [Docker 部署运行](#docker-部署运行)
   - [环境要求](#环境要求)
   - [部署步骤](#部署步骤)
   - [服务架构说明](#服务架构说明)
2. [本地开发环境运行](#本地开发环境运行)
   - [环境要求](#环境要求-1)
   - [后端服务运行](#后端服务运行)
   - [前端服务运行](#前端服务运行)
3. [环境变量配置](#环境变量配置)
   - [必需的环境变量](#必需的环境变量)
   - [获取各服务密钥](#获取各服务密钥)

## Docker 部署运行

### 环境要求

- Docker 20.0+
- Docker Compose 1.29+
- 至少 4GB 可用内存

### 部署步骤

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

### 服务架构说明

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

## 本地开发环境运行

### 环境要求

- Python 3.9+
- Node.js 16+
- npm 8+
- 可访问互联网

### 后端服务运行

1. 克隆项目代码（如果尚未克隆）：
   ```bash
   git clone <repository-url>
   cd AI_Travel_Planner
   ```

2. 创建并激活虚拟环境：
   ```bash
   # 创建虚拟环境
   python -m venv venv
   
   # Windows 激活
   venv\Scripts\activate
   
   # macOS/Linux 激活
   source venv/bin/activate
   ```

3. 安装后端依赖：
   ```bash
   pip install -r requirements.txt
   ```

4. 配置环境变量：
   复制 [.env.example](file:///D:/graduate/AI_Travel_Planner/.env.example) 文件为 `.env` 并填入相应配置：
   ```bash
   cp .env.example .env
   ```
   
   编辑 `.env` 文件，填入各服务的实际密钥和配置信息。

5. 启动后端服务：
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   
   默认情况下，后端服务将运行在 `http://localhost:8000`

### 前端服务运行

1. 进入前端目录：
   ```bash
   cd ai-travel-planner-frontend
   ```

2. 安装前端依赖：
   ```bash
   npm install
   ```

3. 启动前端开发服务器：
   ```bash
   npm start
   ```
   
   默认情况下，前端服务将运行在 `http://localhost:3000`

4. 访问应用：
   打开浏览器访问 `http://localhost:3000`

## 环境变量配置

### 必需的环境变量

项目运行需要以下环境变量，请确保在 `.env` 文件中正确配置：

```env
# Supabase 配置（必需）
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# DashScope 配置 (用于 AI 功能，必需)
DASHSCOPE_API_KEY=your_dashscope_api_key
MODEL_NAME=qwen-plus

# 高德地图 API 配置（可选，目前仅在URI跳转中使用）
GAODE_MAP_KEY=your_gaode_map_key

# 语音识别服务配置（可选）
SPEECH_APP_ID=your_speech_app_id
SPEECH_API_KEY=your_speech_api_key
SPEECH_API_SECRET=your_speech_api_secret

# 数据库配置（必需）
DATABASE_URL=postgresql://postgres:password@localhost:5432/travel_planner
```

### 获取各服务密钥

1. **Supabase**:
   - 访问 [Supabase官网](https://supabase.io/)
   - 创建项目并获取项目 URL 和 API 密钥

2. **DashScope (阿里云)**:
   - 访问 [阿里云官网](https://dashscope.aliyun.com/)
   - 创建应用并获取 API 密钥

3. **高德地图** (可选):
   - 访问 [高德开放平台](https://lbs.amap.com/)
   - 创建应用并获取 API 密钥

4. **语音识别服务** (可选):
   - 根据实际使用的语音识别服务提供商获取相应密钥

注意：标记为"必需"的配置项必须正确配置，否则项目无法正常运行。标记为"可选"的配置项可以暂时使用默认值或空值，但可能会影响部分功能。
