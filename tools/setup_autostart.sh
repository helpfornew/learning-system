#!/bin/bash
# 高考学习智能提醒系统 - 开机自启动设置脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="$SCRIPT_DIR/gaokao-reminder.service"
SYSTEMD_DIR=~/.config/systemd/user

echo "╔════════════════════════════════════════════════════╗"
echo "║     高考学习智能提醒系统 - 开机自启动设置           ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# 检查 systemd 用户服务是否可用
if ! systemctl --user status &>/dev/null; then
    echo "❌ 错误：systemd 用户服务不可用"
    echo "   请确保已登录图形界面并启动了 systemd 用户服务"
    exit 1
fi

# 创建 systemd 目录
echo "📁 创建 systemd 目录..."
mkdir -p "$SYSTEMD_DIR"

# 复制服务文件
echo "📝 创建服务文件..."
cp "$SERVICE_FILE" "$SYSTEMD_DIR/gaokao-reminder.service"

# 重新加载 systemd
echo "🔄 重新加载 systemd 配置..."
systemctl --user daemon-reload

# 启用服务
echo "⚙️ 启用开机自启动..."
systemctl --user enable gaokao-reminder.service

# 启动服务
echo "🚀 启动服务..."
systemctl --user start gaokao-reminder.service

# 等待并检查状态
sleep 2
echo ""
echo "📊 服务状态:"
systemctl --user status gaokao-reminder.service --no-pager -l

echo ""
echo "✅ 设置完成！"
echo ""
echo "服务管理命令:"
echo "  查看状态：systemctl --user status gaokao-reminder"
echo "  停止服务：systemctl --user stop gaokao-reminder"
echo "  重启服务：systemctl --user restart gaokao-reminder"
echo "  禁用自启：systemctl --user disable gaokao-reminder"
echo "  查看日志：journalctl --user -u gaokao-reminder -f"
