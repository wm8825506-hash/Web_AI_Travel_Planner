# Docker 部署指南

## 快速开始

1. 下载以下文件到本地目录：
   - [docker-compose.yml](docker-compose.yml)
   - [.env.example](.env.example)

2. 重命名 `.env.example` 为 `.env`：
   ```bash
   mv .env.example .env
   ```

3. 编辑 `.env` 文件，填入实际的配置值

4. 启动服务：
   ```bash
   docker-compose up -d
   ```

5. 访问应用：
   - 前端界面: http://localhost:3000
   - 后端 API: http://localhost:8000

## 配置说明

在 .env 文件中，您需要配置以下服务的密钥和 URL：

- Supabase 凭据
- DashScope API 密钥（用于 AI 功能）
- 高德地图 API 密钥
- 语音识别服务凭据

## 服务信息

- 后端服务运行在端口 8000
- 前端服务运行在端口 3000
- 健康检查端点: http://localhost:8000/api/health

## 停止服务

```bash
docker-compose down
```