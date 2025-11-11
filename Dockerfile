# 多阶段构建 - 构建阶段
FROM python:3.9-slim as builder

WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装编译依赖和Python依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir -r requirements.txt

# 多阶段构建 - 运行阶段
FROM python:3.9-slim

WORKDIR /app

# 从builder阶段复制已安装的依赖
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# 复制应用代码
COPY app/ ./app/
COPY init_supabase_tables.py .

# 暴露端口
EXPOSE 8000

# 启动应用
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]