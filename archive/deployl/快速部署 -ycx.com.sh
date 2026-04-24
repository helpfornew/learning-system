#!/bin/bash

# 高考学习系统 - 快速部署脚本（带域名配置）
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
echo -e "${BLUE}║     高考学习系统 - 部署脚本                         ║${NC}"
echo -e "${BLUE}║     域名：${DOMAIN}                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查 root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}错误：请使用 sudo 运行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/6] 创建目录结构...${NC}"
mkdir -p "$INSTALL_DIR"
mkdir -p "$DATA_DIR/database"
mkdir -p "$DATA_DIR/backup"
mkdir -p "$DATA_DIR/progress"
mkdir -p "$DATA_DIR/config"
mkdir -p "$LOG_DIR"
mkdir -p /var/www/certbot

chown -R www-data:www-data "$DATA_DIR" "$LOG_DIR"
chmod 755 "$INSTALL_DIR"

echo -e "${YELLOW}[2/6] 复制项目文件...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

rsync -av --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.pyc' \
    --exclude '__pycache__' \
    --exclude '.env' \
    "$PROJECT_ROOT/" "$INSTALL_DIR/"

echo -e "${YELLOW}[3/6] 安装 Python 依赖...${NC}"
pip3 install -q requests

echo -e "${YELLOW}[4/6] 配置 Nginx...${NC}"
# 复制并配置 Nginx
cp "$INSTALL_DIR/deploy/nginx-yoursite.conf" /etc/nginx/sites-available/learning-system
ln -sf /etc/nginx/sites-available/learning-system /etc/nginx/sites-enabled/learning-system
rm -f /etc/nginx/sites-enabled/default

nginx -t && echo "Nginx 配置测试通过"

echo -e "${YELLOW}[5/6] 配置 systemd 服务...${NC}"
cp "$INSTALL_DIR/deploy/learning-system.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable learning-system

echo -e "${YELLOW}[6/6] 申请 SSL 证书...${NC}"
certbot --nginx -d "$DOMAIN" -d "ycx.com" --non-interactive --agree-tos --email your-email@example.com

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     部署完成！                                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}访问地址：${NC} https://$DOMAIN"
echo ""
echo -e "${BLUE}启动服务：${NC}"
echo "  sudo systemctl start learning-system"
echo ""
echo -e "${BLUE}查看状态：${NC}"
echo "  sudo systemctl status learning-system"
echo ""
