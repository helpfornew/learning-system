#!/bin/bash
# 更新 nginx 配置并重新加载

set -e

echo "正在更新 nginx 配置..."

# 复制配置文件
sudo cp /home/ycx/learning_system/deploy/nginx-http-final.conf /etc/nginx/sites-available/learning-system

# 测试配置
echo "测试 nginx 配置..."
sudo nginx -t

# 重新加载 nginx
echo "重新加载 nginx..."
sudo systemctl reload nginx

echo "完成！nginx 配置已更新"
echo ""
echo "访问地址：http://localhost"
