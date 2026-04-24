#!/bin/bash

# 高考学习系统 - 自动化部署脚本
# 域名：www.ycx.com

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="www.ycx.com"
INSTALL_DIR="/opt/learning-system"
DATA_DIR="/var/lib/learning-system"
LOG_DIR="/var/log/learning-system"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     高考学习系统 - 自动化部署                       ║${NC}"
echo -e "${BLUE}║     域名：${DOMAIN}                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查是否已配置 API 密钥
ENV_FILE="$INSTALL_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    if grep -q "你的通义千问" "$ENV_FILE" || grep -q "your_" "$ENV_FILE"; then
        echo -e "${YELLOW}检测到 API 密钥未配置${NC}"
        echo ""
        read -p "请输入通义千问 API Key: " QIANWEN_KEY
        read -p "请输入 DeepSeek API Key: " DEEPSEEK_KEY

        # 生成随机会话密钥
        SESSION_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(16))")

        # 更新 .env 文件
        cat > "$ENV_FILE" << EOF
# 高考学习系统 - 环境变量配置

LEARNING_SYSTEM_DIR=/opt/learning-system
LEARNING_SYSTEM_DATA=/var/lib/learning-system
LEARNING_SYSTEM_HOST=0.0.0.0
LEARNING_SYSTEM_PORT=8080
ALLOWED_ORIGIN=https://www.ycx.com
QIANWEN_API_KEY=${QIANWEN_KEY}
DEEPSEEK_API_KEY=${DEEPSEEK_KEY}
SESSION_SECRET=${SESSION_SECRET}
LOG_LEVEL=INFO
LOG_FILE_PATH=/var/log/learning-system/server.log
EOF
        echo -e "${GREEN}API 密钥已配置${NC}"
    else
        echo -e "${GREEN}API 密钥已存在${NC}"
    fi
fi

# 检查并安装系统依赖
echo -e "${YELLOW}[0/8] 安装系统依赖...${NC}"
if ! command -v nginx &> /dev/null; then
    echo "正在安装 nginx..."
    sudo apt update
    sudo apt install -y nginx
else
    echo "nginx 已安装"
fi

if ! command -v certbot &> /dev/null; then
    echo "正在安装 certbot..."
    sudo apt install -y certbot python3-certbot-nginx
else
    echo "certbot 已安装"
fi

echo ""
echo -e "${YELLOW}[1/8] 创建目录结构...${NC}"
sudo mkdir -p "$INSTALL_DIR"
sudo mkdir -p "$DATA_DIR/database"
sudo mkdir -p "$DATA_DIR/backup"
sudo mkdir -p "$DATA_DIR/progress"
sudo mkdir -p "$DATA_DIR/config"
sudo mkdir -p "$LOG_DIR"
sudo mkdir -p /var/www/certbot

sudo chown -R www-data:www-data "$DATA_DIR" "$LOG_DIR"
sudo chmod 755 "$INSTALL_DIR"

echo -e "${YELLOW}[2/8] 复制项目文件...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

sudo rsync -av --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.pyc' \
    --exclude '__pycache__' \
    --exclude '.env' \
    "$PROJECT_ROOT/" "$INSTALL_DIR/"

sudo cp "$ENV_FILE" "$INSTALL_DIR/.env" 2>/dev/null || true

echo -e "${YELLOW}[3/8] 安装 Python 依赖...${NC}"
# 使用 --break-system-packages 参数（PEP 668 兼容）
sudo pip3 install --break-system-packages -q requests

echo -e "${YELLOW}[4/8] 初始化数据库...${NC}"
cd "$INSTALL_DIR"
# 只初始化数据库，不启动完整服务
export LEARNING_SYSTEM_DIR="$INSTALL_DIR"
export LEARNING_SYSTEM_DATA="$DATA_DIR"
python3 -c "
import sys
sys.path.insert(0, '$INSTALL_DIR/tools')
import unified_server
print('数据库初始化完成')
"

echo -e "${YELLOW}[5/8] 配置 Nginx...${NC}"
# 复制 HTTP 配置
sudo cp "$INSTALL_DIR/deploy/nginx-http-final.conf" /etc/nginx/sites-available/learning-system
sudo ln -sf /etc/nginx/sites-available/learning-system /etc/nginx/sites-enabled/learning-system
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && echo "Nginx 配置测试通过"

echo -e "${YELLOW}[6/8] 配置 systemd 服务...${NC}"
sudo cp "$INSTALL_DIR/deploy/learning-system.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable learning-system

echo -e "${YELLOW}[7/8] 启动服务...${NC}"
# 启动 nginx 和学习系统
sudo systemctl start nginx || sudo systemctl restart nginx
echo "Nginx 已启动"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     部署完成！                                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}访问地址：${NC} http://$DOMAIN"
echo -e "${BLUE}或：${NC} http://服务器IP"
echo ""
echo -e "${BLUE}启动服务：${NC}"
echo "  sudo systemctl start learning-system"
echo ""
echo -e "${BLUE}查看状态：${NC}"
echo "  sudo systemctl status learning-system"
echo ""
echo -e "${BLUE}查看日志：${NC}"
echo "  sudo journalctl -u learning-system -f"
echo ""

echo -e "${YELLOW}[8/8] 启动服务...${NC}"
echo ""

# 自动启动服务
read -p "是否现在启动服务？(y/n): " START_NOW
if [ "$START_NOW" = "y" ]; then
    sudo systemctl start learning-system
    sudo systemctl restart nginx
    echo -e "${GREEN}服务已启动！${NC}"

    # 检查服务状态
    echo ""
    echo -e "${BLUE}服务状态：${NC}"
    sudo systemctl status learning-system --no-pager -l
    sudo systemctl status nginx --no-pager -l

    # 访问测试
    echo ""
    echo -e "${BLUE}访问测试：${NC}"
    curl -s http://127.0.0.1:8080/api/health | head -3
fi
