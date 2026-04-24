#!/bin/bash
# HTTPS 配置脚本 - 用于外网访问摄像头

# 生成自签名证书（开发测试用）
mkdir -p /opt/learning-system/ssl
cd /opt/learning-system/ssl

# 生成私钥
openssl genrsa -out server.key 2048

# 生成证书请求
openssl req -new -key server.key -out server.csr -subj "/C=CN/ST=Beijing/L=Beijing/O=LearningSystem/CN=your-domain.com"

# 生成自签名证书
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

# 合并为PEM格式（某些Python版本需要）
cat server.crt server.key > server.pem

echo "证书生成完成！"
echo "位置: /opt/learning-system/ssl/"
echo "  - server.crt: 证书文件"
echo "  - server.key: 私钥文件"
echo "  - server.pem: 合并文件"
