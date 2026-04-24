#!/bin/bash

# 高考学习系统 - 生产部署脚本
# 用法: ./deploy/deploy.sh [域名] [选项]
# 示例: ./deploy/deploy.sh www.example.com

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 默认配置
DOMAIN="${1:-}"
INSTALL_DIR="/opt/learning-system"
DATA_DIR="/var/lib/learning-system"
LOG_DIR="/var/log/learning-system"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 显示帮助
show_help() {
    echo -e "${BLUE}高考学习系统 - 部署脚本${NC}"
    echo ""
    echo "用法: $0 [域名] [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help       显示帮助信息"
    echo "  --skip-build     跳过前端构建"
    echo "  --skip-nginx     跳过 Nginx 配置"
    echo "  --skip-ssl       跳过 SSL 证书申请"
    echo "  --local          本地部署模式 (使用IP访问，不配置域名)"
    echo ""
    echo "示例:"
    echo "  $0 www.example.com        # 完整部署到域名"
    echo "  $0 --local                # 本地部署模式"
    echo "  $0 www.example.com --skip-build  # 跳过前端构建"
}

# 解析参数
SKIP_BUILD=false
SKIP_NGINX=false
SKIP_SSL=false
LOCAL_MODE=false

for arg in "$@"; do
    case $arg in
        -h|--help)
            show_help
            exit 0
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-nginx)
            SKIP_NGINX=true
            shift
            ;;
        --skip-ssl)
            SKIP_SSL=true
            shift
            ;;
        --local)
            LOCAL_MODE=true
            shift
            ;;
    esac
done

# 检查 root 权限
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}错误: 请使用 sudo 运行此脚本${NC}"
        exit 1
    fi
}

# 打印步骤信息
step() {
    echo ""
    echo -e "${BLUE}[$(date '+%H:%M:%S')] $1${NC}"
}

# 打印成功信息
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 打印警告信息
warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 打印错误信息
error() {
    echo -e "${RED}✗ $1${NC}"
}

# 安装系统依赖
install_dependencies() {
    step "安装系统依赖..."

    apt-get update

    # 基础依赖
    local deps="python3 python3-pip nginx git curl"

    # 检查并安装
    for dep in $deps; do
        if ! command -v "$dep" &> /dev/null; then
            echo "  安装 $dep..."
            apt-get install -y "$dep"
        else
            echo "  $dep 已安装"
        fi
    done

    # 安装 Node.js 18+ (用于构建前端)
    if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 18 ]; then
        echo "  安装 Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi

    # 安装 Certbot (用于 SSL)
    if [ "$LOCAL_MODE" = false ] && [ "$SKIP_SSL" = false ]; then
        if ! command -v certbot &> /dev/null; then
            echo "  安装 certbot..."
            apt-get install -y certbot python3-certbot-nginx
        fi
    fi

    success "系统依赖安装完成"
}

# 构建前端
build_frontend() {
    if [ "$SKIP_BUILD" = true ]; then
        warn "跳过前端构建 (--skip-build)"
        return
    fi

    step "构建前端项目..."

    local frontend_dir="$PROJECT_ROOT/mistake_system/mistake-system-desktop"

    if [ ! -d "$frontend_dir" ]; then
        error "前端目录不存在: $frontend_dir"
        exit 1
    fi

    cd "$frontend_dir"

    # 安装依赖
    echo "  安装 npm 依赖..."
    npm ci

    # 构建
    echo "  构建生产版本..."
    npm run build

    success "前端构建完成"
}

# 创建目录结构
create_directories() {
    step "创建目录结构..."

    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DATA_DIR"/{database,backup,progress,config,uploads}
    mkdir -p "$LOG_DIR"
    mkdir -p /var/www/certbot

    # 设置权限
    chown -R www-data:www-data "$DATA_DIR" "$LOG_DIR"
    chmod 755 "$INSTALL_DIR"
    chmod 750 "$DATA_DIR" "$LOG_DIR"

    success "目录结构创建完成"
}

# 复制项目文件
copy_files() {
    step "复制项目文件..."

    # 使用 rsync 复制文件，排除不需要的文件
    rsync -av --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '*.pyc' \
        --exclude '__pycache__' \
        --exclude '.env' \
        --exclude '.claude' \
        --exclude 'release' \
        --exclude 'dist' \
        "$PROJECT_ROOT/" "$INSTALL_DIR/"

    # 复制构建好的前端文件
    if [ "$SKIP_BUILD" = false ]; then
        mkdir -p "$INSTALL_DIR/mistake_system/mistake-system-desktop/dist"
        cp -r "$PROJECT_ROOT/mistake_system/mistake-system-desktop/dist/"* \
            "$INSTALL_DIR/mistake_system/mistake-system-desktop/dist/" 2>/dev/null || true
    fi

    # 保留原有的 .env 文件（如果存在）
    if [ -f "$PROJECT_ROOT/.env" ]; then
        cp "$PROJECT_ROOT/.env" "$INSTALL_DIR/.env"
    fi

    # 设置权限
    chown -R root:root "$INSTALL_DIR"
    chmod -R 755 "$INSTALL_DIR"

    success "项目文件复制完成"
}

# 配置环境变量
setup_environment() {
    step "配置环境变量..."

    local env_file="$INSTALL_DIR/.env"

    # 如果 .env 不存在或需要更新，创建它
    if [ ! -f "$env_file" ] || grep -q "your_" "$env_file" 2>/dev/null; then
        echo "  配置 .env 文件..."

        # 生成随机会话密钥
        local session_secret
        session_secret=$(python3 -c "import secrets; print(secrets.token_hex(32))")

        # 确定允许的来源
        local allowed_origin="*"
        if [ "$LOCAL_MODE" = false ] && [ -n "$DOMAIN" ]; then
            allowed_origin="https://$DOMAIN"
        fi

        cat > "$env_file" << EOF
# 高考学习系统 - 环境变量配置
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')

# 基础配置
LEARNING_SYSTEM_DIR=$INSTALL_DIR
LEARNING_SYSTEM_DATA=$DATA_DIR
LEARNING_SYSTEM_HOST=0.0.0.0
LEARNING_SYSTEM_PORT=8080
ALLOWED_ORIGIN=$allowed_origin
SESSION_SECRET=$session_secret
LOG_LEVEL=INFO
LOG_FILE_PATH=$LOG_DIR/server.log

# 上传文件大小限制 (20MB)
MAX_CONTENT_LENGTH=20971520

# AI 分析并发数
AI_ANALYSIS_CONCURRENCY=15

# 有道智云 API (可选，用于题目识别)
# YOUDAO_APP_ID=your_app_id
# YOUDAO_APP_SECRET=your_app_secret

# AI API 密钥 (请填写你的密钥)
# QIANWEN_API_KEY=your_qwen_api_key
# DEEPSEEK_API_KEY=your_deepseek_api_key
# OPENAI_API_KEY=your_openai_api_key
EOF

        success "环境变量配置完成"
        warn "请编辑 $env_file 文件，配置你的 AI API 密钥"
    else
        success "环境变量文件已存在"
    fi

    # 设置权限
    chmod 600 "$env_file"
}

# 初始化数据库
init_database() {
    step "初始化数据库..."

    cd "$INSTALL_DIR"

    # 设置临时环境变量
    export LEARNING_SYSTEM_DIR="$INSTALL_DIR"
    export LEARNING_SYSTEM_DATA="$DATA_DIR"

    # 运行数据库初始化
    python3 << 'PYTHON_EOF'
import os
import sys
sys.path.insert(0, os.path.join(os.environ['LEARNING_SYSTEM_DIR'], 'tools'))

# 导入 unified_server 中的数据库初始化函数
exec(open(os.path.join(os.environ['LEARNING_SYSTEM_DIR'], 'unified_server.py')).read())

# 初始化数据库
init_database()
print("数据库初始化完成")
PYTHON_EOF

    # 设置数据库权限
    chown -R www-data:www-data "$DATA_DIR/database"
    chmod 750 "$DATA_DIR/database"

    success "数据库初始化完成"
}

# 配置 systemd 服务
setup_systemd() {
    step "配置 systemd 服务..."

    cat > /etc/systemd/system/learning-system.service << EOF
[Unit]
Description=高考学习系统统一服务器
Documentation=https://github.com/your-org/learning-system
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=www-data
Group=www-data

WorkingDirectory=$INSTALL_DIR
Environment="PATH=/usr/bin:/usr/local/bin"
Environment="PYTHONUNBUFFERED=1"
EnvironmentFile=-$INSTALL_DIR/.env

ExecStart=/usr/bin/python3 -u $INSTALL_DIR/unified_server.py
ExecReload=/bin/kill -HUP \$MAINPID

Restart=always
RestartSec=5
StartLimitInterval=60s
StartLimitBurst=3

LimitNOFILE=65535
Nice=10

StandardOutput=journal
StandardError=journal
SyslogIdentifier=learning-system

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable learning-system

    success "systemd 服务配置完成"
}

# 配置 Nginx
setup_nginx() {
    if [ "$SKIP_NGINX" = true ]; then
        warn "跳过 Nginx 配置 (--skip-nginx)"
        return
    fi

    step "配置 Nginx..."

    if [ "$LOCAL_MODE" = true ]; then
        # 本地模式 - 简单的 HTTP 配置
        cat > /etc/nginx/sites-available/learning-system << 'NGINX_EOF'
server {
    listen 80 default_server;
    server_name _;

    access_log /var/log/nginx/learning-system-access.log;
    error_log /var/log/nginx/learning-system-error.log;

    client_max_body_size 20M;

    # 静态文件根目录
    set $static_root /opt/learning-system/config;
    set $mistake_root /opt/learning-system/mistake_system/mistake-system-desktop/dist;

    # 学习系统主页
    location = / {
        root $static_root;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 错题系统前端（SPA 路由支持）
    location /mistake/ {
        alias $mistake_root/;
        index index.html;
        try_files $uri $uri/ /mistake/index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 账号 API
    location /account/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 健康检查
    location = /health {
        proxy_pass http://127.0.0.1:8080/api/health;
        access_log off;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
NGINX_EOF
    else
        # 域名模式 - 使用模板
        if [ -z "$DOMAIN" ]; then
            warn "未提供域名，使用本地模式配置"
            setup_nginx
            return
        fi

        # 读取模板并替换域名
        sed "s/YOUR_DOMAIN/$DOMAIN/g" "$SCRIPT_DIR/nginx-learning-system.conf" \
            > /etc/nginx/sites-available/learning-system
    fi

    # 启用站点
    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/learning-system /etc/nginx/sites-enabled/learning-system

    # 测试配置
    nginx -t || {
        error "Nginx 配置测试失败"
        exit 1
    }

    success "Nginx 配置完成"
}

# 配置 SSL 证书
setup_ssl() {
    if [ "$LOCAL_MODE" = true ] || [ "$SKIP_SSL" = true ] || [ -z "$DOMAIN" ]; then
        return
    fi

    step "配置 SSL 证书..."

    # 检查证书是否已存在
    if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        warn "SSL 证书已存在，跳过申请"
        return
    fi

    # 先启动 nginx 以便验证
    systemctl start nginx || systemctl restart nginx

    # 申请证书
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" || {
        warn "SSL 证书申请失败，请手动配置"
        return
    }

    success "SSL 证书配置完成"
}

# 启动服务
start_services() {
    step "启动服务..."

    # 启动后端服务
    systemctl restart learning-system
    sleep 2

    # 检查服务状态
    if systemctl is-active --quiet learning-system; then
        success "学习系统服务已启动"
    else
        error "学习系统服务启动失败"
        systemctl status learning-system --no-pager
        exit 1
    fi

    # 启动/重启 Nginx
    if [ "$SKIP_NGINX" = false ]; then
        systemctl restart nginx
        if systemctl is-active --quiet nginx; then
            success "Nginx 已启动"
        else
            error "Nginx 启动失败"
            exit 1
        fi
    fi

    success "所有服务已启动"
}

# 健康检查
health_check() {
    step "执行健康检查..."

    sleep 2

    local health_url
    if [ "$LOCAL_MODE" = true ]; then
        health_url="http://localhost:8080/api/health"
    else
        health_url="http://127.0.0.1:8080/api/health"
    fi

    if curl -s "$health_url" > /dev/null 2>&1; then
        success "健康检查通过"
    else
        warn "健康检查未通过，请检查服务状态"
    fi
}

# 显示部署信息
show_info() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     部署完成！                                      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [ "$LOCAL_MODE" = true ]; then
        echo -e "${BLUE}访问地址:${NC}"
        echo "  http://$(hostname -I | awk '{print $1}')"
        echo "  http://localhost"
    else
        echo -e "${BLUE}访问地址:${NC} http://$DOMAIN"
    fi

    echo ""
    echo -e "${BLUE}常用命令:${NC}"
    echo "  查看状态: sudo systemctl status learning-system"
    echo "  启动服务: sudo systemctl start learning-system"
    echo "  停止服务: sudo systemctl stop learning-system"
    echo "  重启服务: sudo systemctl restart learning-system"
    echo "  查看日志: sudo journalctl -u learning-system -f"
    echo ""
    echo -e "${BLUE}文件位置:${NC}"
    echo "  安装目录: $INSTALL_DIR"
    echo "  数据目录: $DATA_DIR"
    echo "  日志目录: $LOG_DIR"
    echo "  配置文件: $INSTALL_DIR/.env"
    echo ""

    if [ -f "$INSTALL_DIR/.env" ]; then
        if grep -q "your_" "$INSTALL_DIR/.env" 2>/dev/null || grep -q "请填写" "$INSTALL_DIR/.env" 2>/dev/null; then
            warn "请编辑 $INSTALL_DIR/.env 文件，配置你的 API 密钥"
        fi
    fi
}

# 主函数
main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     高考学习系统 - 生产部署                         ║${NC}"
    if [ "$LOCAL_MODE" = true ]; then
        echo -e "${BLUE}║     模式: 本地部署                                  ║${NC}"
    elif [ -n "$DOMAIN" ]; then
        echo -e "${BLUE}║     域名: $DOMAIN${NC}"
    fi
    echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
    echo ""

    check_root
    install_dependencies
    build_frontend
    create_directories
    copy_files
    setup_environment
    init_database
    setup_systemd
    setup_nginx
    setup_ssl
    start_services
    health_check
    show_info
}

# 运行主函数
main
