# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

高考学习系统 - 综合性学习平台，支持错题管理、学习时间跟踪、用户认证等功能。

## 快速开始

### 开发模式

推荐使用启动脚本一键启动：

```bash
./start_dev.sh
```

或手动启动（两个终端）：
```bash
# 终端 1: cd mistake_system/mistake-system-desktop && npm run dev
# 终端 2: export DEV_MODE=1 && export VITE_DEV_SERVER=http://localhost:5173 && python3 unified_server.py
```

访问 http://localhost:8080（错题系统：http://localhost:8080/mistake/）

### 常用命令

```bash
# 开发模式（推荐）
./start_dev.sh                     # 一键启动 Vite + Python 后端

# 错题系统开发
cd mistake_system/mistake-system-desktop
npm run dev                        # Web 开发 (Vite:5173)
npm run dev:electron               # Web + Electron 开发
npm run build                      # 构建生产版本
npm run electron:build             # 打包 Electron
npm run build:linux                # Linux deb 包

# 统一桌面应用
cd desktop_app
npm run dev                        # Electron 开发
npm run build:linux                # 构建 Linux 包

# 前端独立构建
./build_frontend.sh

# 生产部署
cd deploy && sudo ./auto-deploy.sh

# 批量导入高考词汇
python3 tools/import_vocabulary.py

# 数据库迁移
python3 tools/migrate_db.py        # 数据库迁移
python3 tools/add_vocabulary_table.py  # 添加单词本表
```

## 架构结构

### 目录结构

```
learning_system/
├── unified_server.py          # 统一后端服务器 (端口 8080)
├── .env                       # 环境变量配置
├── database/unified_learning.db
├── desktop_app/               # 统一桌面应用 (Electron)
├── mistake_system/
│   └── mistake-system-desktop/ # 错题系统 (React + TS + Electron)
├── account_server/            # 账户认证
├── tools/                     # 工具 API、时间跟踪、智能提醒
└── deploy/                    # 部署脚本
```

### 开发模式

`unified_server.py` 支持开发模式，通过环境变量控制：

```bash
# 开发模式（代理到 Vite）
export DEV_MODE=1
export VITE_DEV_SERVER=http://localhost:5173
python3 unified_server.py
```

或使用启动脚本一键启动：
```bash
./start_dev.sh
```

### 路由分发

`unified_server.py` (8080 端口) 统一处理请求：
| 路由 | 说明 |
|------|------|
| `/` | 学习系统主页 |
| `/mistake/*` | 错题系统前端（开发模式代理到 Vite:5173） |
| `/api/*` | 工具 API（时间跟踪、数据备份等） |
| `/account/*` | 账户认证 API |
| `/tools` | 工具中心页面 |

### 核心 API 端点

```
# 账户
POST /account/api/login
POST /account/api/register

# 错题管理
GET/POST/PUT/DELETE /api/mistakes
GET /api/mistakes/:id/analysis  # AI 分析

# 单词本 (新增)
GET /api/vocabulary             # 获取单词列表
POST /api/vocabulary            # 添加单词
PUT /api/vocabulary/:id         # 更新单词
DELETE /api/vocabulary/:id      # 删除单词
POST /api/vocabulary-review     # 记录复习
POST /api/vocabulary-batch      # 批量导入

# 工具 API
GET/POST /api/study-time        # 学习时间跟踪
GET/POST /api/config            # 用户配置
POST /api/youdao/segment        # 有道题目识别（当前不可用）
```

## 技术栈

- **后端**: Python `http.server`, SQLite
- **前端**: React 18 + TypeScript + Vite
- **UI 库**: Ant Design
- **状态管理**: Zustand + localStorage 持久化
- **图表**: ECharts
- **桌面应用**: Electron 28

## 核心模块

### 错题系统前端

```
mistake_system/mistake-system-desktop/
├── src/
│   ├── App.tsx                    # 主应用、路由、快捷键
│   ├── components/
│   │   ├── Sidebar.tsx            # 导航侧边栏
│   │   └── QuickInputModal.tsx    # 快速录入
│   ├── pages/
│   │   ├── Dashboard.tsx          # 仪表板
│   │   ├── MistakeBook.tsx        # 错题本（含 AI 分析）
│   │   ├── VocabularyBook.tsx     # 单词本（新增）
│   │   ├── DataAnalysis.tsx       # 数据分析 (ECharts)
│   │   ├── PersonalizedLearningPlan.tsx
│   │   ├── ReviewPlan.tsx
│   │   └── Settings.tsx           # 设置（AI 配置等）
│   └── services/
│       ├── aiService.ts           # 统一 AI 接口（DeepSeek/Qwen/OpenAI 等）
│       ├── vocabularyService.ts   # 单词本 API 服务（新增）
│       └── deepseekAnalyzer.ts    # 个性化学习分析
└── electron/
    ├── main.js                    # Electron 主进程
    └── config.json                # 服务器配置
```

### 后端模块

```
├── unified_server.py              # 统一服务器（路由、认证、静态文件）
├── tools/
│   ├── tools_api.py               # 工具 API 入口
│   ├── time_tracker.py            # 学习时间跟踪
│   ├── smart_reminder.py          # 智能提醒
│   └── data_sync_backup.py        # 数据同步备份
└── account_server/
    └── accounts.db                # 账户数据库
```

## 数据库

- `database/unified_learning.db` - 统一数据库（错题、学习记录、配置、单词本）
- `account_server/accounts.db` - 账户认证（users, sessions 表）

错题核心字段：`id`, `subject_id`, `content`, `correct_answer`, `wrong_answer`, `error_reason`, `knowledge_points`, `review_count`, `next_review`

单词本核心字段：`id`, `user_id`, `word`, `phonetic`, `definition`, `example_sentence`, `part_of_speech`, `status`, `熟练度`, `next_review`, `review_count`

## 配置

### 环境变量 (.env)

```bash
LEARNING_SYSTEM_DIR=/opt/learning-system
LEARNING_SYSTEM_DATA=/var/lib/learning-system
LEARNING_SYSTEM_PORT=8080
DEV_MODE=1                          # 开发模式开关
VITE_DEV_SERVER=http://localhost:5173
QIANWEN_API_KEY=xxx                 # 通义千问
DEEPSEEK_API_KEY=xxx                # DeepSeek
YOUDAO_APP_ID=xxx                   # 有道题目识别
YOUDAO_APP_SECRET=xxx
```

### Electron 配置

编辑 `electron/config.json`:
```json
{
  "server": {
    "url": "http://your-server-ip:8080",
    "enableCustomServer": true
  }
}
```

## 关键特性

### AI 集成
支持多 AI 提供商（DeepSeek、Qwen、OpenAI、Anthropic、Google Gemini），在设置页面配置。

### 单点登录 (SSO)
主页登录后 token 存 localStorage，跳转错题系统时通过 URL 参数传递。

### 单词本系统 (新增)
- 单词录入、编辑、删除
- 复习模式（艾宾浩斯遗忘曲线）
- 熟练度跟踪（0-5 级）
- 批量导入高考词汇

### 外部 API
**有道智云题目识别**: 前端 `src/services/youdaoApiService.ts`，后端代理 `/api/youdao/segment`。当前返回 202 错误，前端自动降级到手动裁剪模式。

## 测试

- 前端测试：暂无配置测试框架
- 后端测试：暂无配置测试框架

## 部署

### 运维命令

```bash
sudo systemctl start|stop|restart|status learning-system
journalctl -u learning-system -f
curl http://localhost:8080/api/health  # 健康检查
```

### 已知问题

**Linux deb 包黑屏**: Electron 过度禁用 GPU 导致。解决：
```bash
./fix_black_screen.sh
# 或重新构建
cd mistake_system/mistake-system-desktop && npm run build:linux
```

## 相关文档

- 错题系统详细文档：`mistake_system/mistake-system-desktop/CLAUDE.md`
- 部署指南：`deploy/部署说明.md`, `deploy/部署命令清单.md`
