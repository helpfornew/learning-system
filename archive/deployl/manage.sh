#!/bin/bash

# 高考学习系统 - 运维管理脚本
# 用法: ./deploy/manage.sh [命令] [选项]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
INSTALL_DIR="/opt/learning-system"
DATA_DIR="/var/lib/learning-system"
LOG_DIR="/var/log/learning-system"
DB_FILE="$DATA_DIR/database/unified_learning.db"
BACKUP_DIR="$DATA_DIR/backup"

# 显示帮助
show_help() {
    echo -e "${BLUE}高考学习系统 - 运维管理脚本${NC}"
    echo ""
    echo "用法: $0 <命令> [选项]"
    echo ""
    echo "命令:"
    echo "  status          查看服务状态"
    echo "  logs            查看服务日志 (使用 -f 实时跟踪)"
    echo "  start           启动服务"
    echo "  stop            停止服务"
    echo "  restart         重启服务"
    echo "  reload          重载配置"
    echo "  update          更新代码并重启"
    echo "  backup          备份数据库"
    echo "  restore         从备份恢复数据库"
    echo "  list-backups    列出所有备份"
    echo "  clean-logs      清理旧日志文件"
    echo "  health          健康检查"
    echo "  shell           进入 Python 交互环境"
    echo "  db-console      进入数据库控制台"
    echo "  update-nginx    更新 Nginx 配置"
    echo "  ssl-renew       更新 SSL 证书"
    echo "  reset-password  重置用户密码"
    echo ""
    echo "选项:"
    echo "  -f, --follow    实时跟踪日志"
    echo "  -h, --help      显示帮助"
}

# 检查 root 权限
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}错误: 请使用 sudo 运行此脚本${NC}"
        exit 1
    fi
}

# 查看服务状态
cmd_status() {
    echo -e "${BLUE}服务状态${NC}"
    echo "=============================="
    systemctl status learning-system --no-pager

    echo ""
    echo -e "${BLUE}Nginx 状态${NC}"
    echo "=============================="
    systemctl status nginx --no-pager

    echo ""
    echo -e "${BLUE}资源使用${NC}"
    echo "=============================="
    echo "内存使用:"
    free -h | grep -E "(Mem|Swap)"

    echo ""
    echo "磁盘使用:"
    df -h "$DATA_DIR" "$INSTALL_DIR" 2>/dev/null | head -5

    echo ""
    echo -e "${BLUE}进程信息${NC}"
    echo "=============================="
    ps aux | grep -E "(unified_server|nginx)" | grep -v grep || echo "无运行中的进程"
}

# 查看日志
cmd_logs() {
    local follow="$1"
    if [ "$follow" = "-f" ] || [ "$follow" = "--follow" ]; then
        echo -e "${BLUE}实时日志 (按 Ctrl+C 退出)${NC}"
        journalctl -u learning-system -f
    else
        echo -e "${BLUE}最近 50 条日志${NC}"
        journalctl -u learning-system -n 50 --no-pager
    fi
}

# 启动服务
cmd_start() {
    echo -e "${BLUE}启动服务...${NC}"
    systemctl start learning-system
    sleep 1
    if systemctl is-active --quiet learning-system; then
        echo -e "${GREEN}服务已启动${NC}"
    else
        echo -e "${RED}服务启动失败${NC}"
        systemctl status learning-system --no-pager
    fi
}

# 停止服务
cmd_stop() {
    echo -e "${BLUE}停止服务...${NC}"
    systemctl stop learning-system
    echo -e "${GREEN}服务已停止${NC}"
}

# 重启服务
cmd_restart() {
    echo -e "${BLUE}重启服务...${NC}"
    systemctl restart learning-system
    sleep 2
    if systemctl is-active --quiet learning-system; then
        echo -e "${GREEN}服务已重启${NC}"
    else
        echo -e "${RED}服务重启失败${NC}"
    fi
}

# 重载配置
cmd_reload() {
    echo -e "${BLUE}重载配置...${NC}"
    systemctl reload learning-system 2>/dev/null || systemctl restart learning-system
    echo -e "${GREEN}配置已重载${NC}"
}

# 更新代码
cmd_update() {
    check_root

    local project_root
    project_root="$(dirname "$(dirname "$(readlink -f "$0")")")"

    echo -e "${BLUE}更新代码...${NC}"

    # 检查是否是 git 仓库
    if [ ! -d "$project_root/.git" ]; then
        echo -e "${RED}错误: 不是 git 仓库，无法自动更新${NC}"
        echo "请手动复制最新代码到 $INSTALL_DIR"
        exit 1
    fi

    cd "$project_root"

    # 拉取最新代码
    git pull origin main || git pull origin master

    # 构建前端
    echo "构建前端..."
    cd "$project_root/mistake_system/mistake-system-desktop"
    npm ci
    npm run build

    # 复制文件
    echo "复制文件..."
    rsync -av --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '*.pyc' \
        --exclude '__pycache__' \
        --exclude '.env' \
        "$project_root/" "$INSTALL_DIR/"

    # 复制构建好的前端
    mkdir -p "$INSTALL_DIR/mistake_system/mistake-system-desktop/dist"
    cp -r "$project_root/mistake_system/mistake-system-desktop/dist/"* \
        "$INSTALL_DIR/mistake_system/mistake-system-desktop/dist/" 2>/dev/null || true

    # 重启服务
    echo "重启服务..."
    systemctl restart learning-system

    echo -e "${GREEN}更新完成！${NC}"
}

# 备份数据库
cmd_backup() {
    check_root

    local backup_name="backup_$(date +%Y%m%d_%H%M%S).db"
    local backup_path="$BACKUP_DIR/$backup_name"

    mkdir -p "$BACKUP_DIR"

    echo -e "${BLUE}备份数据库...${NC}"

    if [ ! -f "$DB_FILE" ]; then
        echo -e "${RED}错误: 数据库文件不存在: $DB_FILE${NC}"
        exit 1
    fi

    # 使用 SQLite 备份命令确保数据一致性
    sqlite3 "$DB_FILE" ".backup '$backup_path'"

    # 压缩备份
    gzip "$backup_path"
    backup_path="${backup_path}.gz"

    # 保留最近 30 个备份，删除旧的
    cd "$BACKUP_DIR"
    ls -t backup_*.db.gz 2>/dev/null | tail -n +31 | xargs -r rm -f

    echo -e "${GREEN}备份完成: $backup_path${NC}"
    ls -lh "$backup_path"
}

# 列出备份
cmd_list_backups() {
    echo -e "${BLUE}备份列表${NC}"
    echo "=============================="

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        echo "暂无备份"
        return
    fi

    ls -lht "$BACKUP_DIR" | grep backup_ | head -20
}

# 恢复数据库
cmd_restore() {
    check_root

    echo -e "${BLUE}恢复数据库${NC}"
    echo "=============================="

    # 列出可用备份
    cmd_list_backups

    echo ""
    echo -n "请输入要恢复的备份文件名: "
    read -r backup_name

    local backup_path="$BACKUP_DIR/$backup_name"

    if [ ! -f "$backup_path" ]; then
        echo -e "${RED}错误: 备份文件不存在${NC}"
        exit 1
    fi

    # 确认
    echo -e "${YELLOW}警告: 这将覆盖当前数据库！${NC}"
    echo -n "确认恢复? (yes/no): "
    read -r confirm

    if [ "$confirm" != "yes" ]; then
        echo "已取消"
        exit 0
    fi

    # 先备份当前数据库
    cmd_backup

    # 停止服务
    systemctl stop learning-system

    # 恢复
    if [[ "$backup_path" == *.gz ]]; then
        gunzip -c "$backup_path" > "$DB_FILE.tmp"
        mv "$DB_FILE.tmp" "$DB_FILE"
    else
        cp "$backup_path" "$DB_FILE"
    fi

    chown www-data:www-data "$DB_FILE"
    chmod 640 "$DB_FILE"

    # 启动服务
    systemctl start learning-system

    echo -e "${GREEN}数据库已恢复${NC}"
}

# 清理日志
cmd_clean_logs() {
    check_root

    echo -e "${BLUE}清理日志...${NC}"

    # 清理系统日志
    journalctl --vacuum-time=30d

    # 清理应用日志
    find "$LOG_DIR" -name "*.log.*" -mtime +30 -delete 2>/dev/null || true
    find "$LOG_DIR" -name "*.log" -size +100M -exec sh -c 'echo "" > "$1"' _ {} \; 2>/dev/null || true

    echo -e "${GREEN}日志清理完成${NC}"
}

# 健康检查
cmd_health() {
    echo -e "${BLUE}健康检查${NC}"
    echo "=============================="

    local status="ok"

    # 检查服务状态
    if systemctl is-active --quiet learning-system; then
        echo -e "服务状态: ${GREEN}运行中${NC}"
    else
        echo -e "服务状态: ${RED}未运行${NC}"
        status="error"
    fi

    # 检查端口
    if ss -tlnp | grep -q ":8080"; then
        echo -e "端口 8080: ${GREEN}监听中${NC}"
    else
        echo -e "端口 8080: ${RED}未监听${NC}"
        status="error"
    fi

    # 检查 API
    if curl -s http://127.0.0.1:8080/api/health > /dev/null 2>&1; then
        echo -e "API 健康: ${GREEN}正常${NC}"
    else
        echo -e "API 健康: ${RED}异常${NC}"
        status="error"
    fi

    # 检查数据库
    if [ -f "$DB_FILE" ]; then
        echo -e "数据库文件: ${GREEN}存在 ($(du -h "$DB_FILE" | cut -f1))${NC}"
    else
        echo -e "数据库文件: ${RED}不存在${NC}"
        status="error"
    fi

    # 检查磁盘空间
    local disk_usage
    disk_usage=$(df "$DATA_DIR" | tail -1 | awk '{print $5}' | tr -d '%')
    if [ "$disk_usage" -lt 80 ]; then
        echo -e "磁盘使用: ${GREEN}${disk_usage}%${NC}"
    elif [ "$disk_usage" -lt 90 ]; then
        echo -e "磁盘使用: ${YELLOW}${disk_usage}%${NC}"
    else
        echo -e "磁盘使用: ${RED}${disk_usage}%${NC}"
        status="warning"
    fi

    # 检查内存
    local mem_usage
    mem_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    if [ "$mem_usage" -lt 80 ]; then
        echo -e "内存使用: ${GREEN}${mem_usage}%${NC}"
    elif [ "$mem_usage" -lt 90 ]; then
        echo -e "内存使用: ${YELLOW}${mem_usage}%${NC}"
    else
        echo -e "内存使用: ${RED}${mem_usage}%${NC}"
        status="warning"
    fi

    echo ""
    if [ "$status" = "ok" ]; then
        echo -e "${GREEN}✓ 所有检查通过${NC}"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠ 存在警告${NC}"
    else
        echo -e "${RED}✗ 存在错误${NC}"
    fi
}

# 进入 Python Shell
cmd_shell() {
    cd "$INSTALL_DIR"
    export LEARNING_SYSTEM_DIR="$INSTALL_DIR"
    export LEARNING_SYSTEM_DATA="$DATA_DIR"
    python3 -i << 'PYTHON_EOF'
import sys
sys.path.insert(0, 'tools')
print("Python 交互环境")
print("已导入: sys, os")
print("可用变量: LEARNING_SYSTEM_DIR, LEARNING_SYSTEM_DATA")
PYTHON_EOF
}

# 进入数据库控制台
cmd_db_console() {
    if [ ! -f "$DB_FILE" ]; then
        echo -e "${RED}错误: 数据库文件不存在${NC}"
        exit 1
    fi

    echo -e "${BLUE}进入数据库控制台 (SQLite)${NC}"
    echo -e "${YELLOW}提示: 使用 .tables 查看表, .schema 查看表结构, .quit 退出${NC}"
    echo ""

    sqlite3 "$DB_FILE"
}

# 更新 Nginx 配置
cmd_update_nginx() {
    check_root

    local project_root
    project_root="$(dirname "$(dirname "$(readlink -f "$0")")")"

    echo -e "${BLUE}更新 Nginx 配置...${NC}"

    # 从 .env 读取域名
    local domain
    domain=$(grep "ALLOWED_ORIGIN" "$INSTALL_DIR/.env" 2>/dev/null | cut -d'=' -f2 | sed 's|https://||;s|http://||' || echo "")

    if [ -z "$domain" ] || [ "$domain" = "*" ]; then
        echo -e "${YELLOW}未配置域名，跳过更新${NC}"
        return
    fi

    # 更新配置
    sed "s/YOUR_DOMAIN/$domain/g" "$project_root/deploy/nginx-learning-system.conf" \
        > /etc/nginx/sites-available/learning-system

    nginx -t && systemctl reload nginx

    echo -e "${GREEN}Nginx 配置已更新${NC}"
}

# 更新 SSL 证书
cmd_ssl_renew() {
    check_root

    echo -e "${BLUE}更新 SSL 证书...${NC}"
    certbot renew --nginx
    echo -e "${GREEN}SSL 证书已更新${NC}"
}

# 重置用户密码
cmd_reset_password() {
    check_root

    echo -e "${BLUE}重置用户密码${NC}"
    echo "=============================="

    echo -n "请输入用户名: "
    read -r username

    echo -n "请输入新密码: "
    read -rs password
    echo ""

    cd "$INSTALL_DIR"
    export LEARNING_SYSTEM_DIR="$INSTALL_DIR"
    export LEARNING_SYSTEM_DATA="$DATA_DIR"

    python3 << PYTHON_EOF
import sys
import hashlib
sys.path.insert(0, 'tools')
sys.path.insert(0, 'account_server')

import sqlite3
import os

db_path = os.path.join(os.environ['LEARNING_SYSTEM_DATA'], 'database', 'unified_learning.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 检查用户
username = "$username"
password = "$password"

# 计算密码哈希
password_hash = hashlib.sha256(password.encode()).hexdigest()

cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
user = cursor.fetchone()

if user:
    cursor.execute("UPDATE users SET password_hash = ? WHERE username = ?", (password_hash, username))
    conn.commit()
    print(f"用户 {username} 的密码已重置")
else:
    print(f"用户 {username} 不存在")

conn.close()
PYTHON_EOF
}

# 主函数
main() {
    local cmd="$1"
    shift || true

    case "$cmd" in
        status)
            cmd_status
            ;;
        logs)
            cmd_logs "$@"
            ;;
        start)
            check_root
            cmd_start
            ;;
        stop)
            check_root
            cmd_stop
            ;;
        restart)
            check_root
            cmd_restart
            ;;
        reload)
            check_root
            cmd_reload
            ;;
        update)
            cmd_update
            ;;
        backup)
            cmd_backup
            ;;
        restore)
            cmd_restore
            ;;
        list-backups)
            cmd_list_backups
            ;;
        clean-logs)
            cmd_clean_logs
            ;;
        health)
            cmd_health
            ;;
        shell)
            cmd_shell
            ;;
        db-console)
            cmd_db_console
            ;;
        update-nginx)
            cmd_update_nginx
            ;;
        ssl-renew)
            cmd_ssl_renew
            ;;
        reset-password)
            cmd_reset_password
            ;;
        -h|--help|help)
            show_help
            ;;
        *)
            if [ -z "$cmd" ]; then
                show_help
            else
                echo -e "${RED}未知命令: $cmd${NC}"
                echo "使用 '$0 --help' 查看帮助"
                exit 1
            fi
            ;;
    esac
}

main "$@"
