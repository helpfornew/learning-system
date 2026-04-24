#!/bin/bash

# 高考学习系统 - 本地测试部署脚本
# 用于在本地环境测试部署流程（不需要 sudo）

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALL_DIR="$HOME/learning-system-test"
DATA_DIR="$HOME/learning-system-data"
LOG_DIR="$HOME/learning-system-logs"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     高考学习系统 - 本地测试部署                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}[1/5] 创建目录结构...${NC}"
mkdir -p "$INSTALL_DIR"
mkdir -p "$DATA_DIR/database"
mkdir -p "$DATA_DIR/backup"
mkdir -p "$DATA_DIR/progress"
mkdir -p "$DATA_DIR/config"
mkdir -p "$LOG_DIR"

echo -e "${YELLOW}[2/5] 复制项目文件...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

rsync -av --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.pyc' \
    --exclude '__pycache__' \
    --exclude '.env' \
    "$PROJECT_ROOT/" "$INSTALL_DIR/"

# 复制 .env 文件
if [ -f "$PROJECT_ROOT/.env" ]; then
    cp "$PROJECT_ROOT/.env" "$INSTALL_DIR/.env"
    echo -e "${GREEN}.env 文件已复制${NC}"
fi

# 更新 .env 中的路径
cat > "$INSTALL_DIR/.env" << EOF
# 高考学习系统 - 环境变量配置（本地测试）

LEARNING_SYSTEM_DIR=$INSTALL_DIR
LEARNING_SYSTEM_DATA=$DATA_DIR
LEARNING_SYSTEM_HOST=127.0.0.1
LEARNING_SYSTEM_PORT=8080
ALLOWED_ORIGIN=http://localhost:8080
QIANWEN_API_KEY=sk-74e11994aec34e96820430e52729ea22
DEEPSEEK_API_KEY=sk-eebc4e1b8d31429394ea836734833e2f
SESSION_SECRET=dc9b3db9547f414c7522fef255a0abb3
LOG_LEVEL=INFO
LOG_FILE_PATH=$LOG_DIR/server.log
EOF

echo -e "${YELLOW}[3/5] 安装 Python 依赖...${NC}"
pip3 install --break-system-packages -q requests

echo -e "${YELLOW}[4/5] 初始化数据库...${NC}"
cd "$INSTALL_DIR"
export LEARNING_SYSTEM_DIR="$INSTALL_DIR"
export LEARNING_SYSTEM_DATA="$DATA_DIR"
export LEARNING_SYSTEM_HOST="127.0.0.1"
export LEARNING_SYSTEM_PORT="8080"
export LOG_FILE_PATH="$LOG_DIR/server.log"

# 启动服务器（后台运行）
python3 unified_server.py &
SERVER_PID=$!
sleep 3

# 检查服务器是否启动
if curl -s http://127.0.0.1:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}服务器启动成功！${NC}"
    echo ""
    echo -e "${BLUE}访问地址：${NC} http://127.0.0.1:8080"
    echo -e "${BLUE}工具中心：${NC} http://127.0.0.1:8080/tools"
    echo ""
    echo "服务器进程 ID: $SERVER_PID"
    echo "停止服务：kill $SERVER_PID"
else
    echo -e "${RED}服务器启动失败，请检查日志${NC}"
    tail -20 "$LOG_DIR/server.log" 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}部署完成！${NC}"
