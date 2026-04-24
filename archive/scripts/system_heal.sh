#!/bin/bash

# 高考学习系统 - 系统修复和验证脚本
echo "==================================================="
echo "    高考学习系统 - 系统修复和验证脚本"
echo "==================================================="

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}步骤 1: 检查并创建缺失的目录${NC}"

# 检查并创建必要的目录
DIRECTORIES=("account_server" "config")
for dir in "${DIRECTORIES[@]}"; do
    if [ ! -d "$dir" ]; then
        echo -e "${YELLOW}创建目录: $dir${NC}"
        mkdir -p "$dir"
    else
        echo -e "${GREEN}目录已存在: $dir${NC}"
    fi
done

echo -e "\n${BLUE}步骤 2: 检查数据库文件${NC}"

# 检查账户数据库
if [ ! -f "account_server/accounts.db" ]; then
    echo -e "${YELLOW}账户数据库不存在，正在创建...${NC}"
    python3 init_accounts_db.py
else
    echo -e "${GREEN}账户数据库已存在${NC}"
fi

# 检查错题数据库
if [ ! -f "mistake_system/mistake-system-desktop/.data/mistakes.db" ]; then
    echo -e "${RED}警告: 错题数据库不存在${NC}"
else
    echo -e "${GREEN}错题数据库已存在${NC}"
fi

# 检查学习时间数据库
if [ ! -f "progress/study_time.db" ]; then
    echo -e "${RED}警告: 学习时间数据库不存在${NC}"
else
    echo -e "${GREEN}学习时间数据库已存在${NC}"
fi

echo -e "\n${BLUE}步骤 3: 检查主页文件${NC}"

# 确保主页文件存在于正确的位置
if [ ! -f "config/index.html" ]; then
    if [ -f "desktop_app/config/index.html" ]; then
        echo -e "${YELLOW}将主页文件复制到config目录${NC}"
        cp desktop_app/config/index.html config/index.html
        echo -e "${GREEN}主页文件已复制${NC}"
    else
        echo -e "${RED}错误: 未找到主页文件${NC}"
    fi
else
    echo -e "${GREEN}主页文件已存在${NC}"
fi

echo -e "\n${BLUE}步骤 4: 验证统一服务器配置${NC}"

# 检查unified_server.py中引用的路径是否存在
MISSING_PATHS=()
if [ ! -d "account_server" ]; then
    MISSING_PATHS+=("account_server")
fi

if [ ! -d "config" ]; then
    MISSING_PATHS+=("config")
fi

if [ ! -d "mistake_system/mistake-system-desktop/dist" ]; then
    MISSING_PATHS+=("mistake_system/mistake-system-desktop/dist")
fi

if [ ${#MISSING_PATHS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ 所有必需的路径都已存在${NC}"
else
    echo -e "${YELLOW}⚠️ 以下路径仍然缺失: ${MISSING_PATHS[*]}${NC}"
fi

echo -e "\n${BLUE}步骤 5: 检查配置文件${NC}"

if [ -f "config.json" ]; then
    echo -e "${GREEN}配置文件存在${NC}"
else
    echo -e "${RED}配置文件不存在${NC}"
fi

echo -e "\n${BLUE}步骤 6: 验证Python依赖${NC}"

# 尝试导入关键模块
python3 -c "import sqlite3, json, os, re, pathlib, http.server, urllib.parse, datetime, urllib.request, urllib.error, mimetypes, hashlib" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Python依赖检查通过${NC}"
else
    echo -e "${YELLOW}⚠️  部分Python依赖可能有问题（通常标准库没有问题）${NC}"
fi

echo -e "\n${BLUE}步骤 7: 尝试启动服务器进行测试${NC}"

# 终止可能存在的旧进程
pkill -f unified_server.py 2>/dev/null

# 短暂启动服务器进行测试
echo "启动服务器进行测试..."
timeout 5s python3 unified_server.py &
TEST_PID=$!
sleep 3

if ps -p $TEST_PID > /dev/null; then
    echo -e "${GREEN}✅ 服务器启动成功${NC}"
    kill $TEST_PID 2>/dev/null
else
    echo -e "${YELLOW}⚠️  服务器可能存在问题${NC}"
fi

echo -e "\n${GREEN}==================================================="
echo "    系统修复和验证完成！"
echo "===================================================${NC}"
echo ""
echo "系统现在应该可以正常工作了。您可以使用以下命令启动系统："
echo "  ./start_all.sh start"
echo ""
echo "默认管理员账户："
echo "  用户名: admin"
echo "  密码: admin123"
echo ""