# Dockerfile

# 1. 选择一个基础 Python 镜像
FROM python:3.11-slim

# 3. 设置工作目录
WORKDIR /app

# 4. 安装系统依赖 (如果需要，例如编译某些 Python 包可能需要)
# RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential libpq-dev && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y python3-dev default-libmysqlclient-dev build-essential pkg-config
# 5. 安装 Python 依赖
# 先复制 requirements.txt 并安装，利用 Docker 的层缓存机制
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6. 复制项目代码到工作目录
COPY . .

RUN chmod +x entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

# 7. 暴露端口 (Django 开发服务器默认端口为 8000)
EXPOSE 8000

# 8. 运行命令 (开发环境)
# 注意：runserver 不适用于生产环境！
CMD ["gunicorn", "webDjangoProject3.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
