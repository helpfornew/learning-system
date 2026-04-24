#!/bin/bash
# 高考学习系统 - 摄像头测试脚本

echo "======================================"
echo "  高考学习系统 - 摄像头测试"
echo "======================================"

# 检查摄像头设备
echo ""
echo "1. 检查摄像头设备..."
if [ -e /dev/video0 ]; then
    echo "   ✓ 找到摄像头设备：/dev/video0"
    ls -l /dev/video0
else
    echo "   ✗ 未找到摄像头设备"
    echo "   请检查摄像头是否已连接"
    exit 1
fi

# 检查摄像头权限
echo ""
echo "2. 检查摄像头权限..."
if [ -r /dev/video0 ] && [ -w /dev/video0 ]; then
    echo "   ✓ 摄像头权限正常"
else
    echo "   ✗ 摄像头权限不足"
    echo "   请运行以下命令修复权限："
    echo "   sudo chmod 666 /dev/video0"
    echo "   或者将用户加入 video 组："
    echo "   sudo usermod -aG video \$USER"
fi

# 检查已安装的 Electron 应用
echo ""
echo "3. 检查 Electron 应用..."
if [ -f /opt/GaokaoLearningSystem/gaokao-learning-system ]; then
    echo "   ✓ 应用已安装：/opt/GaokaoLearningSystem/gaokao-learning-system"
else
    echo "   ✗ 应用未安装"
    echo "   请先安装应用："
    echo "   sudo dpkg -i ~/learning_system/desktop_app/release/gaokao-learning-system_1.0.0_amd64.deb"
    exit 1
fi

# 提供测试说明
echo ""
echo "======================================"
echo "  测试步骤"
echo "======================================"
echo ""
echo "1. 启动应用："
echo "   /opt/GaokaoLearningSystem/gaokao-learning-system"
echo ""
echo "2. 登录后，按 F2 打开快速录入窗口"
echo ""
echo "3. 点击「启动摄像头」按钮"
echo ""
echo "4. 如果看到摄像头画面，点击「拍摄」按钮"
echo ""
echo "5. 如果摄像头无法启动，查看控制台日志："
echo "   - 按 Ctrl+Shift+I 打开开发者工具"
echo "   - 查看 Console 标签页的错误信息"
echo ""
echo "======================================"
echo "  快速启动命令"
echo "======================================"
echo ""
echo "直接运行（前台）："
echo "  /opt/GaokaoLearningSystem/gaokao-learning-system"
echo ""
echo "后台运行并查看日志："
echo "  /opt/GaokaoLearningSystem/gaokao-learning-system > /tmp/learning-system.log 2>&1 &"
echo "  tail -f /tmp/learning-system.log"
echo ""
echo "======================================"
