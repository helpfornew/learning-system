#!/bin/bash
# 高考学习系统 - 开发模式启动脚本
# 自动启动 Vite 开发服务器和 Python 后端，支持热更新

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================"
echo "  高考学习系统 - 开发模式"
echo "======================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误：未找到 Node.js，请先安装 Node.js 16+"
    exit 1
fi

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "错误：未找到 Python3，请先安装 Python 3.7+"
    exit 1
fi

# 启动 Vite 开发服务器（后台运行）
echo "[1/3] 启动 Vite 开发服务器..."
cd mistake_system/mistake-system-desktop
npm run dev > /tmp/vite-dev.log 2>&1 &
VITE_PID=$!
cd "$SCRIPT_DIR"

# 等待 Vite 启动
echo "[2/3] 等待 Vite 开发服务器启动..."
sleep 3

# 检查 Vite 是否启动成功
if ! kill -0 $VITE_PID 2>/dev/null; then
    echo "错误：Vite 开发服务器启动失败"
    cat /tmp/vite-dev.log
    exit 1
fi

# 启动 Python 后端（开发模式）
echo "[3/3] 启动 Python 后端（开发模式）..."
echo ""
echo "======================================"
echo "  开发环境已就绪！"
echo "======================================"
echo ""
echo "  访问地址：http://localhost:8080"
echo "  错题系统：http://localhost:8080/mistake/"
echo "  Vite 服务器：http://localhost:5173"
echo ""
echo "  提示：修改代码后刷新浏览器即可生效"
echo "  按 Ctrl+C 停止所有服务"
echo "======================================"
echo ""

# 设置环境变量并启动 Python 后端
export DEV_MODE=1
export VITE_DEV_SERVER=http://localhost:5173

# 捕获 Ctrl+C 信号，清理后台进程
trap "echo ''; echo '停止所有服务...'; kill $VITE_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# 启动 Python 后端（前台运行）
python3 unified_server.py
