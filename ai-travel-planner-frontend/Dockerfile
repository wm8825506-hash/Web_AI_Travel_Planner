# 使用官方 Node.js 运行时作为基础镜像
FROM node:18-alpine

# 安装 nginx
RUN apk add --no-cache nginx

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --legacy-peer-deps

# 复制应用源代码
COPY . .

# 构建应用
RUN npm run build

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 创建 nginx 日志目录
RUN mkdir -p /var/log/nginx && \
    mkdir -p /usr/share/nginx/html && \
    cp -r build/* /usr/share/nginx/html/

# 暴露端口
EXPOSE 3000

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]