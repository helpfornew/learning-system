# 高考学习系统 - 部署文档

## 目录结构

```
deploy/
├── deploy.sh                    # 主部署脚本（生产环境）
├── manage.sh                    # 运维管理脚本
├── learning-system.service      # systemd 服务配置
├── nginx-learning-system.conf   # Nginx 配置模板
├── logrotate.conf               # 日志轮转配置
└── README.md                    # 本文档
```

## 快速开始

### 1. 生产部署

```bash
# 使用域名部署（推荐）
sudo ./deploy/deploy.sh www.yourdomain.com

# 本地/内网部署（使用 IP）
sudo ./deploy/deploy.sh --local
```

### 2. 运维管理

```bash
# 查看状态
sudo ./deploy/manage.sh status

# 查看日志
sudo ./deploy/manage.sh logs -f

# 重启服务
sudo ./deploy/manage.sh restart

# 备份数据库
sudo ./deploy/manage.sh backup

# 健康检查
sudo ./deploy/manage.sh health
```

## 文件说明

| 文件 | 说明 |
|------|------|
| **deploy.sh** | 完整的自动化部署脚本，支持域名/本地模式，自动安装依赖、构建前端、配置服务 |
| **manage.sh** | 日常运维工具：状态查看、日志、备份恢复、数据库控制台等 |
| **learning-system.service** | systemd 服务配置模板，开机自启、自动重启 |
| **nginx-learning-system.conf** | Nginx 配置模板，含 YOUR_DOMAIN 占位符 |
| **logrotate.conf** | 日志轮转配置，保留 30 天 |

## 部署后配置

### 1. 配置 API 密钥（必须）

```bash
sudo nano /opt/learning-system/.env
```

添加：
```bash
QIANWEN_API_KEY=your_key
DEEPSEEK_API_KEY=your_key
```

### 2. 配置 logrotate

```bash
sudo cp deploy/logrotate.conf /etc/logrotate.d/learning-system
```

## 服务管理命令

```bash
# 启动/停止/重启
sudo systemctl start learning-system
sudo systemctl stop learning-system
sudo systemctl restart learning-system

# 查看状态
sudo systemctl status learning-system

# 查看日志
sudo journalctl -u learning-system -f

# 开机自启
sudo systemctl enable learning-system
```

## 目录结构

| 路径 | 用途 |
|------|------|
| /opt/learning-system | 应用程序代码 |
| /var/lib/learning-system | 数据（数据库、备份） |
| /var/log/learning-system | 日志文件 |
| /etc/nginx/sites-available/learning-system | Nginx 配置 |
| /etc/systemd/system/learning-system.service | 服务配置 |

## 故障排查

```bash
# 检查端口
sudo ss -tlnp | grep 8080

# 检查数据库
sudo ./deploy/manage.sh db-console

# 测试 Nginx
sudo nginx -t

# 查看详细错误
sudo journalctl -u learning-system -n 50
```
