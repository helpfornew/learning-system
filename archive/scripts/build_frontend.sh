#!/bin/bash

# 高考错题系统 - 前端独立构建脚本
# 用于生成可独立部署的前端静态文件包

set -e  # 遇到错误立即退出

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔════════════════════════════════════════════════════╗"
echo "║         高考错题系统 - 前端独立构建工具             ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# 检查必要工具
echo "🔍 检查构建环境..."

if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未找到 npm，请先安装 Node.js"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "⚠️  警告：未找到 git"
fi

# 构建目标配置
BUILD_DIR="mistake_system/mistake-system-desktop"
DIST_DIR="$BUILD_DIR/dist"
PACKAGE_NAME="mistake-system-frontend-$(date +%Y%m%d_%H%M%S)"

echo "📦 准备构建前端应用..."

# 进入前端目录
cd "$BUILD_DIR"

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "⏳ 安装前端依赖..."
    npm install --legacy-peer-deps
fi

# 检查是否有构建配置
if [ ! -f "vite.config.ts" ] && [ ! -f "vite.config.js" ]; then
    echo "❌ 错误：未找到构建配置文件"
    exit 1
fi

# 备份原配置
if [ -f "vite.config.ts" ]; then
    cp vite.config.ts vite.config.ts.backup
elif [ -f "vite.config.js" ]; then
    cp vite.config.js vite.config.js.backup
fi

echo "🔧 构建前端应用..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败，恢复原配置..."
    if [ -f "vite.config.ts.backup" ]; then
        mv vite.config.ts.backup vite.config.ts
    elif [ -f "vite.config.js.backup" ]; then
        mv vite.config.js.backup vite.config.js
    fi
    exit 1
fi

echo "✅ 构建成功！"

# 打包分发
echo "📦 创建分发包..."

# 创建打包目录
PACK_DIR="../packages"
mkdir -p "$PACK_DIR"

# 创建最终打包目录
FINAL_PACKAGE_DIR="$PACK_DIR/$PACKAGE_NAME"
mkdir -p "$FINAL_PACKAGE_DIR"

# 复制构建结果
cp -r "$DIST_DIR" "$FINAL_PACKAGE_DIR/dist"

# 创建部署说明
cat > "$FINAL_PACKAGE_DIR/DEPLOYMENT_NOTES.md" << 'EOF'
# 高考错题系统 - 前端部署说明

## 部署方法

将 `dist/` 目录下的所有文件部署到您的Web服务器或CDN上。

## 配置API地址

前端需要配置后端API服务器地址。编辑 `dist/index.html` 或相关的配置文件，
将API基础URL指向您的后端服务器地址。

例如：
- 如果后端部署在 https://api.yoursite.com
- 则需要将所有 `/api/` 的请求重定向到 https://api.yoursite.com/api/

## 环境变量

前端构建时使用了相对路径，确保部署时保持正确的静态资源引用。

## 支持的浏览器

- Chrome >= 70
- Firefox >= 65
- Safari >= 12
- Edge >= 79

## 故障排除

### 资源加载失败
- 检查静态资源路径是否正确
- 确认服务器支持压缩传输（gzip）

### API连接失败
- 检查CORS配置是否正确
- 确认后端服务器正常运行且可访问

## 版本信息
EOF

# 添加当前版本信息
echo "" >> "$FINAL_PACKAGE_DIR/DEPLOYMENT_NOTES.md"
echo "- 构建时间: $(date)" >> "$FINAL_PACKAGE_DIR/DEPLOYMENT_NOTES.md"
echo "- 原始路径: $BUILD_DIR" >> "$FINAL_PACKAGE_DIR/DEPLOYMENT_NOTES.md"

# 创建配置模板
cat > "$FINAL_PACKAGE_DIR/API_CONFIG_TEMPLATE.json" << 'EOF'
{
  "apiBaseUrl": "https://your-backend-server.com/api",
  "authEndpoint": "https://your-backend-server.com/account",
  "timeout": 30000,
  "retryAttempts": 3
}
EOF

# 打包为zip（便于分发）
echo "🎁 创建ZIP压缩包..."
cd "$PACK_DIR"
zip -r "${PACKAGE_NAME}.zip" "$PACKAGE_NAME/"

echo ""
echo "🎉 构建完成！"
echo ""
echo "📦 生成的包位置: $PACK_DIR/${PACKAGE_NAME}.zip"
echo "📁 解压后的目录: $PACK_DIR/$PACKAGE_NAME/"
echo ""
echo "📋 接下来要做的："
echo "   1. 将 $PACK_DIR/${PACKAGE_NAME}.zip 发送给客户"
echo "   2. 客户解压后部署到他们的Web服务器"
echo "   3. 配置API地址指向您的公网后端服务器"
echo ""
