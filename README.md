# 高考学习系统

高考学习系统是一个专为高考备考设计的综合性学习平台，支持错题管理、学习时间跟踪、用户认证等功能。系统采用前后端分离架构，支持云端部署和客户端分发。

## 特性

- 🎯 **专注高考**：专为高考备考设计的功能
- 🔐 **用户认证**：完整的用户注册和登录系统（邀请码机制）
- 📚 **错题管理**：高效错题录入、分类和复习
- 📖 **单词本**：艾宾浩斯遗忘曲线复习，批量导入高考词汇
- 📚 **学习平台**：化学/物理/语文等多学科学习系统
- ⏰ **时间跟踪**：学习时间记录和分析
- 📅 **学习时间表**：个性化每日/每周学习计划
- 📊 **进度监控**：学习目标和进度可视化
- 🤖 **AI 集成**：支持 DeepSeek、通义千问等 AI 分析
- ☁️ **云端部署**：支持后端部署到云服务器
- 💻 **跨平台**：前端可独立部署到各种环境
- 🔗 **单点登录**：主页与错题系统间无缝切换

## 架构

系统采用前后端分离架构：

```
┌─────────────────┐    HTTP API     ┌─────────────────┐
│   客户端应用     │◄──────────────►│   云端服务器     │
│  （React应用）   │                │  （Python后端）   │
│                 │                │                 │
│ - 静态资源      │                │ - 用户认证      │
│ - 本地运行      │                │ - 数据存储      │
│ - API请求       │                │ - 业务逻辑      │
└─────────────────┘                └─────────────────┘
```

## 快速开始

### 环境要求

- **后端**: Python 3.7+
- **前端**: Node.js 16+, npm
- **系统**: Linux/macOS/Windows

### 传统一体化部署

```bash
# 启动所有服务（本地模式）
./start_all.sh start
```

访问 `http://localhost:8080`

### 开发模式

```bash
# 一键启动开发模式（Vite + Python后端）
./start_dev.sh

# 或手动启动
# 终端1: 启动前端开发服务器
cd mistake_system/mistake-system-desktop && npm run dev

# 终端2: 启动后端（开发模式）
export DEV_MODE=1
export VITE_DEV_SERVER=http://localhost:5173
python3 unified_server.py
```

### 前后端分离部署

#### 1. 部署后端到云服务器

```bash
# 配置环境
cp .env.example .env
# 编辑 .env 文件配置参数

# 启动服务
python3 unified_server.py
```

#### 2. 构建并分发前端

```bash
# 构建前端应用
./build_frontend.sh

# 或构建Linux deb包
cd mistake_system/mistake-system-desktop
npm run build:linux
# 生成的deb包位于 release/ 目录下
```

## 服务器配置

### 客户端设置服务器IP

高考错题系统客户端支持自定义服务器IP地址，以便连接到指定的后端服务。

#### 1. 通过配置文件设置（推荐）

编辑配置文件 `config.json`:
```json
{
  "server": {
    "url": "http://your-server-ip:8080",
    "enableCustomServer": true,
    "allowInsecureConnection": true
  }
}
```

#### 2. 通过应用界面设置

在应用的设置界面中可以动态修改服务器地址。

更多信息请参考 [docs/SERVER_CONFIGURATION.md](docs/SERVER_CONFIGURATION.md)

## 单点登录(SSO)功能

系统支持在学习系统主页和错题系统之间实现单点登录。用户在主页登录后，访问错题系统时无需重复登录。

### 实现方式
- 主页登录后将认证token保存到localStorage
- 从主页跳转到错题系统时，token通过URL参数传递
- 错题系统接收token，验证后自动登录

更多信息请参考 [docs/SSO_GUIDE.md](docs/SSO_GUIDE.md)

## 已知问题及解决方案

### Linux Deb包黑屏问题

**问题**: 在某些Linux发行版上，安装deb包后的客户端可能出现黑屏。

**原因**: Electron配置中启用了headless模式，并且过度禁用了GPU功能。

**解决方案**:
1. 使用提供的修复脚本:
```bash
./fix_black_screen.sh
```

2. 重新构建deb包:
```bash
cd mistake_system/mistake-system-desktop
npm run build:linux
```

**注意**: 已经修复并验证！新构建的deb包(>= 2.0.0版本)已解决此问题。

详细解决方案请参考 [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## 目录结构

```
learning_system/
├── unified_server.py         # 统一后端服务器（主入口）
├── start_all.sh              # 一键启动脚本（生产模式）
├── start_dev.sh              # 开发模式启动脚本
├── build_frontend.sh         # 前端构建脚本
├── fix_black_screen.sh       # 黑屏问题修复脚本
├── config/                   # 配置文件目录
│   ├── index.html            # 主页
│   └── tools.html            # 工具中心页面
├── docs/                     # 文档目录
│   ├── API_DOCS.md           # API 接口文档
│   ├── DEVELOPER_GUIDE.md    # 开发指南
│   ├── USER_MANUAL.md        # 用户手册
│   ├── DEPLOYMENT.md         # 部署指南
│   ├── ARCHITECTURE.md       # 架构文档
│   ├── TROUBLESHOOTING.md    # 故障排除指南
│   ├── SSO_GUIDE.md          # 单点登录配置指南
│   └── SERVER_CONFIGURATION.md # 服务器配置说明
├── server/                   # 后端服务器模块
│   ├── auth.py               # 认证模块
│   ├── database.py           # 数据库管理
│   ├── config.py             # 服务器配置
│   └── handlers/             # API 处理器
│       ├── account.py        # 账户认证
│       ├── mistakes.py       # 错题管理
│       ├── vocabulary.py     # 单词本
│       ├── schedule.py       # 学习时间表
│       ├── study_time.py     # 学习时间
│       ├── learning_platform.py # 学习平台
│       ├── config_api.py     # 配置管理
│       ├── user_ai_config.py # AI 配置
│       └── weekly_analysis.py # 周分析
├── tests/                    # 测试目录（待创建）
├── account_server/           # 账户服务（数据存储）
├── mistake_system/           # 错题系统前端
│   └── mistake-system-desktop/ # React + Electron 应用
├── learning-platform/        # 学习平台前端
├── desktop_app/              # 统一桌面应用
├── wordcard/                 # 单词卡系统
├── database/                 # 数据库目录
├── data/                     # 数据目录
└── ...
```

## API 接口

系统提供完整的 REST API：

### 认证接口
- `POST /account/api/register` - 用户注册（需邀请码）
- `POST /account/api/login` - 用户登录
- `GET /account/api/user` - 获取当前用户信息

### 错题管理
- `GET /api/mistakes` - 获取错题列表
- `POST /api/mistakes` - 创建错题
- `PUT /api/mistakes/{id}` - 更新错题
- `DELETE /api/mistakes/{id}` - 删除错题

### 单词本
- `GET /api/vocabulary` - 获取单词列表
- `POST /api/vocabulary` - 添加单词
- `POST /api/vocabulary-batch` - 批量导入单词

### 学习时间表
- `GET /api/schedule` - 获取时间表
- `GET /api/schedule/today` - 获取今日时间表
- `POST /api/schedule` - 保存时间表

### 学习平台
- `GET /learning/api/subjects` - 获取科目列表
- `GET /learning/api/subjects/{key}` - 获取科目详情
- `GET /learning/api/chapters/{key}` - 获取章节内容
- `POST /learning/api/progress` - 更新阅读进度

### 其他接口
- `GET /api/study-time` - 学习时间跟踪
- `GET /api/config` - 用户配置管理
- `GET /api/ai-config` - AI 配置管理
- `GET /api/weekly-analysis` - 个性化学习分析

**完整 API 文档**: [docs/API_DOCS.md](docs/API_DOCS.md)

## 部署选项

1. **本地部署**: 一键启动所有服务
2. **云端部署**: 后端部署到服务器，前端独立分发
3. **混合部署**: 部分服务本地，部分服务云端

部署详细指南请参见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 开发

开发相关文档请参见 [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)

## 测试

运行测试：

```bash
# 安装测试依赖
pip install pytest pytest-cov

# 运行所有测试
pytest tests/

# 运行特定模块测试
pytest tests/test_account.py
pytest tests/test_mistakes.py

# 生成覆盖率报告
pytest --cov=server tests/
```

## 技术栈

- **后端**: Python 3.7+, http.server, SQLite
- **前端**: React 18, TypeScript, Vite, Ant Design
- **状态管理**: Zustand
- **图表**: ECharts
- **构建工具**: Vite, npm
- **部署**: systemd, nginx
- **桌面应用**: Electron 28

## 文档索引

| 文档 | 说明 |
|------|------|
| [docs/API_DOCS.md](docs/API_DOCS.md) | 完整 API 接口文档 |
| [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | 开发指南和代码规范 |
| [docs/USER_MANUAL.md](docs/USER_MANUAL.md) | 用户使用手册 |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | 部署指南 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 系统架构文档 |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | 故障排除指南 |
| [docs/SSO_GUIDE.md](docs/SSO_GUIDE.md) | 单点登录配置 |
| [docs/SERVER_CONFIGURATION.md](docs/SERVER_CONFIGURATION.md) | 服务器配置说明 |

## 安全

- 密码使用 salt + SHA256 hash 存储
- Token 认证机制（7天有效期）
- SQL 注入防护（参数化查询）
- CORS 策略控制
- 用户数据隔离（基于 user_id 的权限检查）

## 许可证

此项目仅供学习和教育目的使用。

## 支持

如需技术支持，请查阅相关文档或联系开发团队。