#!/bin/bash
# 高考学习系统 - 开发模式启动脚本（单终端版本）
# 使用 concurrently 同时启动 Vite 和 Python 后端

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================"
echo "  高考学习系统 - 开发模式"
echo "======================================"
echo ""

# 检查依赖
if ! command -v npm &> /dev/null; then
    echo "错误：未找到 npm"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "错误：未找到 python3"
    exit 1
fi

# 检查是否安装了 concurrently
cd mistake_system/mistake-system-desktop
if ! npm ls concurrently &> /dev/null; then
    echo "安装 concurrently..."
    npm install --save-dev concurrently
fi
cd "$SCRIPT_DIR"

echo "启动开发服务器..."
echo ""
echo "======================================"
echo "  访问地址：http://localhost:8080"
echo "  错题系统：http://localhost:8080/mistake/"
echo ""
echo "  提示：修改代码后刷新浏览器即可生效"
echo "  按 Ctrl+C 停止所有服务"
echo "======================================"
echo ""

# 设置环境变量
export DEV_MODE=1
export VITE_DEV_SERVER=http://localhost:5173

# 同时启动两个服务
cd mistake_system/mistake-system-desktop
npx concurrently \
    --names "Vite,Python" \
    --prefix-colors "blue,green" \
    --kill-others \
    "npm run dev" \
    "sleep 3 && cd ../.. && python3 unified_server.py"
