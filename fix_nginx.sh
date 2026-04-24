#!/bin/bash
# 修复nginx配置脚本

sudo tee /etc/nginx/sites-available/learning-system > /dev/null << 'EOF'
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name gkzxtools.xyz www.gkzxtools.xyz;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 服务器配置
server {
    listen 443 ssl http2;
    server_name gkzxtools.xyz www.gkzxtools.xyz;

    # SSL 证书配置
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/cert.key;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头配置
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";

    # 日志配置
    access_log /var/log/nginx/learning-system-access.log;
    error_log /var/log/nginx/learning-system-error.log;

    # 上传文件大小限制
    client_max_body_size 20M;

    # ===================================
    # 路由配置（按优先级排序）
    # ===================================

    # 1. API 路由（最高优先级）
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /account/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /learning/api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 2. 静态资源路由
    location /mistake/assets/ {
        alias /opt/learning-system/mistake_system/mistake-system-desktop/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /static/ {
        alias /opt/learning-system/static/;
        expires 1M;
        add_header Cache-Control "public";
    }

    location /images/ {
        alias /opt/learning-system/images/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 3. 学习平台前端
    location /learning/ {
        alias /opt/learning-system/learning-platform/;
        index index.html;
        try_files $uri $uri/ =404;
        error_page 404 /learning/index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 4. 单词卡前端
    location /wordcard/ {
        alias /opt/learning-system/wordcard/;
        index index.html;
        try_files $uri $uri/ =404;
        error_page 404 /wordcard/index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 5. 错题系统前端
    location /mistake/ {
        alias /opt/learning-system/mistake_system/mistake-system-desktop/dist/;
        index index.html;
        try_files $uri $uri/ =404;
        error_page 404 /mistake/index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 6. 工具页面
    location = /tools {
        alias /opt/learning-system/config/tools.html;
        default_type text/html;
    }

    location = /health {
        proxy_pass http://127.0.0.1:8080/api/health;
        access_log off;
    }

    # 7. 主页（最低优先级）
    location / {
        root /opt/learning-system/config;
        index index.html;
        try_files $uri $uri/ =404;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

echo "Nginx配置已更新"

# 测试配置
echo "测试nginx配置..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "配置测试通过，重新加载nginx..."
    sudo systemctl reload nginx
    echo "Nginx已重新加载"
else
    echo "配置测试失败，请检查错误"
fi
