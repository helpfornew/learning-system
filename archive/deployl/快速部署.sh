#!/bin/bash

# 高考学习系统 - 服务器快速部署脚本
# 适用于 Ubuntu 20.04/22.04

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║     高考学习系统 - 服务器快速部署                   ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}错误：请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# 配置变量
INSTALL_DIR="/opt/learning-system"
DOMAIN=""
EMAIL=""

# 读取用户输入
read -p "请输入域名 (如：example.com): " DOMAIN
read -p "请输入邮箱 (用于 SSL 证书): " EMAIL

echo -e "${YELLOW}[1/6] 更新系统包...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}[2/6] 安装 Python3 和依赖...${NC}"
apt install -y python3 python3-pip python3-venv sqlite3

echo -e "${YELLOW}[3/6] 安装 Nginx...${NC}"
apt install -y nginx

echo -e "${YELLOW}[4/6] 安装 Certbot(SSL 证书)...${NC}"
apt install -y certbot python3-certbot-nginx

echo -e "${YELLOW}[5/6] 部署应用...${NC}"

# 创建安装目录
mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

# 复制项目文件 (假设项目在当前目录)
if [ -f "../unified_server.py" ]; then
    cp -r ../* $INSTALL_DIR/
else
    echo -e "${RED}错误：未找到项目文件，请先上传到服务器${NC}"
    exit 1
fi

# 创建日志目录
mkdir -p logs
mkdir -p backup

# 初始化数据库
echo "初始化数据库..."
python3 account_server/commercial_accounts.py

# 设置权限
chown -R www-data:www-data $INSTALL_DIR
chmod -R 755 $INSTALL_DIR

echo -e "${YELLOW}[6/6] 配置 Nginx 和 SSL...${NC}"

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/learning-system << 'NGINX_EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    # 临时 SSL 配置 (稍后会被 Certbot 更新)
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 静态文件
    location /mistake/ {
        alias INSTALL_DIR_PLACEHOLDER/mistake_system/mistake-system-desktop/dist/;
        try_files $uri $uri/ /mistake/index.html;
    }

    location / {
        root INSTALL_DIR_PLACEHOLDER/config;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location /account/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 日志
    access_log /var/log/nginx/learning-system-access.log;
    error_log /var/log/nginx/learning-system-error.log;
}
NGINX_EOF

# 替换占位符
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/learning-system
sed -i "s|INSTALL_DIR_PLACEHOLDER|$INSTALL_DIR|g" /etc/nginx/sites-available/learning-system

# 启用站点
ln -sf /etc/nginx/sites-available/learning-system /etc/nginx/sites-enabled/learning-system

# 测试 Nginx 配置
nginx -t

# 获取 SSL 证书
echo "申请 SSL 证书..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL

# 重启 Nginx
systemctl restart nginx

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo "服务器地址：https://$DOMAIN"
echo "管理后台：https://$DOMAIN/admin"
echo ""
echo "创建管理员账号:"
echo "  cd $INSTALL_DIR"
echo "  python3 account_server/commercial_accounts.py"
echo ""
echo "启动服务:"
echo "  cd $INSTALL_DIR"
echo "  python3 unified_server.py &"
echo ""
echo -e "${YELLOW}注意：${NC}请手动创建 Systemd 服务以实现开机自启"
echo ""
