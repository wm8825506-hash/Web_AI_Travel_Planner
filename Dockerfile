# 多阶段构建 - 构建前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# 复制前端 package 文件
COPY ai-travel-planner-frontend/package.json ai-travel-planner-frontend/package-lock.json ./

# 安装前端依赖
RUN npm ci --legacy-peer-deps

# 复制前端源代码
COPY ai-travel-planner-frontend/. .

# 设置构建环境变量
ENV GENERATE_SOURCEMAP=false
ENV PUBLIC_URL=/static

# 构建前端应用
RUN npm run build

# 多阶段构建 - 构建后端
FROM python:3.9-slim AS backend-builder

WORKDIR /app

# 复制后端依赖文件
COPY requirements.txt .

# 安装编译依赖和Python依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir -r requirements.txt

# 最终阶段 - 运行阶段
FROM python:3.9-slim

WORKDIR /app

# 从backend-builder阶段复制已安装的依赖
COPY --from=backend-builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# 从frontend-builder阶段复制构建的前端文件到static目录
COPY --from=frontend-builder /app/build /app/static

# 确保static目录存在并添加一个标记文件
RUN ls -la /app/static && find /app/static -name "*.html" | head -1

# 复制后端应用代码
COPY app/ ./app/
COPY init_supabase_tables.py .

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# 启动应用
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]