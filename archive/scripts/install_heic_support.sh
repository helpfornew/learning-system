#!/bin/bash
# 安装 HEIC/HEIF 图片格式支持

echo "=========================================="
echo "安装 iPhone HEIC/HEIF 图片格式支持"
echo "=========================================="
echo ""

# 检查 Python
echo "[1/3] 检查 Python 环境..."
python3 --version || { echo "错误：未找到 Python3"; exit 1; }

# 安装依赖库
echo ""
echo "[2/3] 安装 pillow-heif 库..."
echo "这将支持 iPhone HEIC/HEIF 格式的自动转换"
echo ""

pip3 install pillow-heif

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ pillow-heif 安装成功！"
else
    echo ""
    echo "❌ 安装失败，尝试使用 apt 安装系统库..."
    echo ""

    # 安装系统依赖
    sudo apt-get update
    sudo apt-get install -y libheif-examples libheif-dev

    # 再次尝试安装 Python 库
    pip3 install pillow-heif
fi

# 验证安装
echo ""
echo "[3/3] 验证安装..."
python3 -c "import pillow_heif; print('✅ pillow-heif 版本:', pillow_heif.__version__)" 2>/dev/null || echo "⚠️ 验证失败，可能需要手动检查"

echo ""
echo "=========================================="
echo "安装完成！"
echo ""
echo "现在 iPhone 照片（HEIC 格式）可以自动转换了。"
echo "重启服务器后生效：python3 unified_server.py"
echo "=========================================="
