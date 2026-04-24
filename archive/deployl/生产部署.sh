#!/bin/bash

# 高考学习系统 - 生产环境部署脚本
# 适用于 Ubuntu 20.04/22.04/24.04

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
INSTALL_DIR="/opt/learning-system"
DATA_DIR="/var/lib/learning-system"
LOG_DIR="/var/log/learning-system"
USER="www-data"
GROUP="www-data"
DOMAIN=""
EMAIL=""

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     高考学习系统 - 生产环境部署                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}错误：请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# 读取用户输入
read -p "请输入域名 (如：example.com，直接回车使用 HTTP 模式): " DOMAIN
if [ -n "$DOMAIN" ]; then
    read -p "请输入邮箱 (用于 SSL 证书): " EMAIL
fi

echo ""
echo -e "${YELLOW}[1/8] 更新系统包...${NC}"
apt update && apt upgrade -y -qq

echo ""
echo -e "${YELLOW}[2/8] 安装依赖...${NC}"
apt install -y -qq \
    python3 \
    python3-pip \
    python3-venv \
    sqlite3 \
    nginx \
    certbot \
    python3-certbot-nginx \
    git \
    curl \
    wget

echo ""
echo -e "${YELLOW}[3/8] 创建目录结构...${NC}"
mkdir -p "$INSTALL_DIR"
mkdir -p "$DATA_DIR/database"
mkdir -p "$DATA_DIR/backup"
mkdir -p "$DATA_DIR/progress"
mkdir -p "$DATA_DIR/config"
mkdir -p "$LOG_DIR"

# 设置权限
chown -R "$USER:$GROUP" "$DATA_DIR" "$LOG_DIR"
chmod 755 "$INSTALL_DIR"

echo ""
echo -e "${YELLOW}[4/8] 复制项目文件...${NC}"
# 获取当前脚本所在目录的项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 复制文件（排除不需要的目录）
rsync -av --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.pyc' \
    --exclude '__pycache__' \
    --exclude '.env' \
    "$PROJECT_ROOT/" "$INSTALL_DIR/"

# 复制模板文件
cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
echo ""
echo -e "${YELLOW}请编辑配置文件设置 API 密钥:${NC}"
echo -e "${BLUE}  nano $INSTALL_DIR/.env${NC}"
echo ""
read -p "按回车键继续..."

echo ""
echo -e "${YELLOW}[5/8] 安装 Python 依赖...${NC}"
cd "$INSTALL_DIR"
pip3 install -q requests

# 检查是否需要构建前端
if [ -d "$INSTALL_DIR/mistake_system/mistake-system-desktop" ]; then
    if command -v npm &> /dev/null; then
        echo "检测到前端源码，开始构建..."
        cd "$INSTALL_DIR/mistake_system/mistake-system-desktop"
        npm install --legacy-peer-deps -q
        npm run build
    fi
fi

echo ""
echo -e "${YELLOW}[6/8] 初始化数据库...${NC}"
cd "$INSTALL_DIR"
python3 unified_server.py &
SERVER_PID=$!
sleep 3
kill $SERVER_PID 2>/dev/null || true
echo "数据库初始化完成"

echo ""
echo -e "${YELLOW}[7/8] 配置 Nginx...${NC}"
# 复制 Nginx 配置
NGINX_CONF="$INSTALL_DIR/deploy/nginx-learning-system.conf"
if [ -f "$NGINX_CONF" ]; then
    # 替换域名占位符
    if [ -n "$DOMAIN" ]; then
        sed -i "s/YOUR_DOMAIN/$DOMAIN/g" "$NGINX_CONF"
    else
        # 如果没有域名，使用 HTTP 模式
        cat > /etc/nginx/sites-available/learning-system << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    # 学习系统主页
    location = / {
        root /opt/learning-system/config;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 工具中心
    location = /tools {
        alias /opt/learning-system/config/tools.html;
        default_type text/html;
    }

    # 错题系统
    location /mistake/ {
        alias /opt/learning-system/mistake_system/mistake-system-desktop/dist/;
        try_files $uri $uri/ /mistake/index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /account/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX_EOF
    fi
fi

# 启用站点
ln -sf /etc/nginx/sites-available/learning-system /etc/nginx/sites-enabled/learning-system
# 移除默认配置
rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
nginx -t && echo "Nginx 配置测试通过"

echo ""
echo -e "${YELLOW}[8/8] 配置 systemd 服务...${NC}"
# 复制 systemd 配置
cp "$INSTALL_DIR/deploy/learning-system.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable learning-system

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     部署完成！                                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# 根据配置显示不同的访问信息
if [ -n "$DOMAIN" ]; then
    echo -e "申请 SSL 证书..."
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"

    echo ""
    echo -e "${BLUE}访问地址：${NC}"
    echo "  https://$DOMAIN"
    echo ""
    echo -e "${BLUE}证书自动续期：${NC}"
    echo "  Certbot 已自动配置，证书到期前会自动续期"
else
    echo -e "${BLUE}访问地址：${NC}"
    echo "  http://$(hostname -I | awk '{print $1}'):8080"
    echo ""
    echo -e "${YELLOW}注意：${NC}当前使用 HTTP 模式，建议配置域名和 SSL 证书以保证安全"
fi

echo ""
echo -e "${BLUE}系统服务命令：${NC}"
echo "  systemctl start learning-system    # 启动服务"
echo "  systemctl stop learning-system     # 停止服务"
echo "  systemctl restart learning-system  # 重启服务"
echo "  systemctl status learning-system   # 查看状态"
echo "  journalctl -u learning-system -f   # 查看日志"
echo ""
echo -e "${BLUE}配置文件位置：${NC}"
echo "  应用配置：$INSTALL_DIR/.env"
echo "  Nginx 配置：/etc/nginx/sites-available/learning-system"
echo "  Systemd 配置：/etc/systemd/system/learning-system.service"
echo ""
echo -e "${YELLOW}下一步：${NC}"
echo "  1. 编辑 $INSTALL_DIR/.env 设置 API 密钥"
echo "  2. systemctl start learning-system 启动服务"
echo "  3. 访问上述地址开始使用"
echo ""
