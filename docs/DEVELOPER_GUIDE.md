# 高考学习系统 - 开发指南

本文档为开发者提供系统架构、代码规范和开发流程的详细说明。

---

## 目录

- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发环境配置](#开发环境配置)
- [代码规范](#代码规范)
- [后端开发](#后端开发)
- [前端开发](#前端开发)
- [测试指南](#测试指南)
- [部署流程](#部署流程)
- [故障排除](#故障排除)

---

## 快速开始

### 克隆项目

```bash
git clone <repository-url>
cd learning_system
```

### 开发模式启动

```bash
# 一键启动开发环境
./start_dev.sh

# 或手动启动
# 终端1: 启动前端开发服务器
cd mistake_system/mistake-system-desktop && npm run dev

# 终端2: 启动后端（开发模式）
export DEV_MODE=1
export VITE_DEV_SERVER=http://localhost:5173
python3 unified_server.py
```

访问 `http://localhost:8080`

---

## 项目结构

```
learning_system/
├── config/                     # 配置文件目录
│   ├── index.html              # 主页
│   └── tools.html              # 工具中心页面
├── docs/                       # 文档目录
│   ├── API_DOCS.md             # API 接口文档
│   ├── DEVELOPER_GUIDE.md      # 本文件
│   ├── USER_MANUAL.md          # 用户手册
│   ├── DEPLOYMENT.md           # 部署指南
│   ├── ARCHITECTURE.md         # 架构文档
│   ├── TROUBLESHOOTING.md      # 故障排除
│   └── ...
├── server/                     # 后端服务器模块
│   ├── auth.py                 # 认证模块
│   ├── database.py             # 数据库管理
│   ├── config.py               # 服务器配置
│   └── handlers/               # API 处理器
│       ├── account.py          # 账户认证
│       ├── mistakes.py         # 错题管理
│       ├── vocabulary.py       # 单词本
│       ├── schedule.py         # 学习时间表
│       ├── study_time.py       # 学习时间
│       ├── learning_platform.py # 学习平台
│       ├── config_api.py       # 配置管理
│       ├── user_ai_config.py   # AI 配置
│       └── weekly_analysis.py  # 周分析
├── tests/                      # 测试目录
│   ├── conftest.py             # 测试配置
│   ├── test_account.py         # 账户测试
│   ├── test_mistakes.py        # 错题测试
│   └── test_integration.py     # 集成测试
├── mistake_system/             # 错题系统前端
│   └── mistake-system-desktop/ # React + Electron 应用
├── learning-platform/          # 学习平台前端
├── desktop_app/                # 统一桌面应用
├── wordcard/                   # 单词卡系统
├── unified_server.py           # 统一后端服务器
├── start_all.sh                # 生产模式启动
├── start_dev.sh                # 开发模式启动
└── build_frontend.sh           # 前端构建脚本
```

---

## 开发环境配置

### 系统要求

- **操作系统**: Linux (推荐 Ubuntu 22.04+), macOS, Windows (WSL)
- **Python**: 3.8+
- **Node.js**: 18+
- **npm**: 9+

### 后端依赖

```bash
# 基础依赖（通常已预装）
python3 -m pip install sqlite3 logging

# 可选依赖（用于环境变量加载）
python3 -m pip install python-dotenv
```

### 前端依赖

```bash
cd mistake_system/mistake-system-desktop
npm install
```

### 环境变量配置

创建 `.env` 文件：

```bash
# 基础配置
LEARNING_SYSTEM_DIR=/opt/learning_system
LEARNING_SYSTEM_DATA=/opt/learning_system/data
LEARNING_SYSTEM_HOST=0.0.0.0
LEARNING_SYSTEM_PORT=8080
LOG_LEVEL=INFO

# 开发模式
DEV_MODE=1
VITE_DEV_SERVER=http://localhost:5173

# API 配置
MAX_CONTENT_LENGTH=20971520  # 20MB
AI_ANALYSIS_CONCURRENCY=15

# 有道翻译 API（可选）
YOUDAO_APP_ID=your_app_id
YOUDAO_APP_SECRET=your_secret
```

---

## 代码规范

### Python 代码规范

#### 命名规范

- **模块名**: 小写 + 下划线（`mistake_handler.py`）
- **类名**: 大驼峰（`MistakeHandler`）
- **函数名**: 小写 + 下划线（`handle_mistakes_get`）
- **常量**: 全大写（`MAX_CONTENT_LENGTH`）
- **私有函数**: 下划线前缀（`_create_connection`）

#### 函数文档字符串

```python
def handle_mistakes_get(user_id, params):
    """
    获取用户的错题列表

    Args:
        user_id (int): 用户ID
        params (dict): 查询参数

    Returns:
        tuple: (status_code, response_dict)

    Example:
        >>> status, result = handle_mistakes_get(1, {})
        >>> assert status == 200
        >>> assert result['success'] is True
    """
```

#### 导入顺序

```python
# 1. 标准库
import json
import os
from datetime import datetime

# 2. 第三方库
import sqlite3

# 3. 本地模块
from ..database import get_db
from ..config import logger
```

### JavaScript/TypeScript 规范

#### 命名规范

- **组件**: 大驼峰（`MistakeList.tsx`）
- **函数**: 小驼峰（`handleSubmit`）
- **常量**: 全大写（`MAX_ITEMS`）
- **类型/接口**: 大驼峰（`MistakeData`）

#### 组件结构

```typescript
// 1. 导入
import React, { useState } from 'react';
import { Mistake } from '../types';

// 2. 类型定义
interface Props {
  mistake: Mistake;
  onUpdate: (id: number) => void;
}

// 3. 组件
export const MistakeCard: React.FC<Props> = ({ mistake, onUpdate }) => {
  // 状态
  const [isEditing, setIsEditing] = useState(false);

  // 处理函数
  const handleClick = () => {
    onUpdate(mistake.id);
  };

  // 渲染
  return (
    <div className="mistake-card">
      {/* ... */}
    </div>
  );
};
```

---

## 后端开发

### 添加新 API Handler

在 `server/handlers/` 目录下创建新文件：

```python
# server/handlers/example.py
"""示例 API 处理器"""
from ..database import get_db

def handle_example_get(user_id, params):
    """GET /api/example"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT * FROM example WHERE user_id = ?', (user_id,))
        rows = cursor.fetchall()
        return 200, {'success': True, 'data': [dict(r) for r in rows]}
    finally:
        conn.close()

def handle_example_post(user_id, data):
    """POST /api/example"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    # 参数验证
    required_fields = ['name', 'value']
    for field in required_fields:
        if field not in data:
            return 400, {'success': False, 'message': f'缺少必填字段: {field}'}

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            'INSERT INTO example (user_id, name, value) VALUES (?, ?, ?)',
            (user_id, data['name'], data['value'])
        )
        conn.commit()
        return 200, {'success': True, 'id': cursor.lastrowid}
    except Exception as e:
        conn.rollback()
        return 500, {'success': False, 'message': str(e)}
    finally:
        conn.close()
```

### 注册路由

在 `unified_server.py` 中添加路由：

```python
from server.handlers.example import handle_example_get, handle_example_post

# 在 route_request 方法中添加
elif path == '/api/example':
    if method == 'GET':
        return handle_example_get(user_id, params)
    elif method == 'POST':
        return handle_example_post(user_id, body)
```

### 数据库操作规范

#### 基本查询

```python
conn = get_db()
cursor = conn.cursor()

try:
    cursor.execute('SELECT * FROM table WHERE id = ?', (id,))
    row = cursor.fetchone()
finally:
    conn.close()
```

#### 事务处理

```python
conn = get_db()
cursor = conn.cursor()

try:
    cursor.execute('INSERT INTO ...', (...))
    cursor.execute('UPDATE ...', (...))
    conn.commit()
except Exception as e:
    conn.rollback()
    raise
finally:
    conn.close()
```

#### 防止 SQL 注入

**永远不要使用字符串拼接 SQL**：

```python
# ❌ 错误
query = f"SELECT * FROM users WHERE username = '{username}'"

# ✅ 正确
query = "SELECT * FROM users WHERE username = ?"
cursor.execute(query, (username,))
```

### 认证检查

```python
def handle_protected_api(user_id, data):
    # 1. 检查登录状态
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    # 2. 检查权限（如需要）
    if not is_admin(user_id):
        return 403, {'success': False, 'message': '需要管理员权限'}

    # 3. 执行业务逻辑
    ...
```

---

## 前端开发

### 目录结构

```
mistake-system-desktop/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── MistakeCard/
│   │   ├── ErrorAnalysis/
│   │   └── StudyTimer/
│   ├── pages/               # 页面组件
│   │   ├── Home/
│   │   ├── MistakeList/
│   │   └── Settings/
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useMistakes.ts
│   │   └── useStudyTime.ts
│   ├── stores/              # 状态管理 (Zustand)
│   │   ├── authStore.ts
│   │   ├── mistakeStore.ts
│   │   └── configStore.ts
│   ├── utils/               # 工具函数
│   │   ├── api.ts
│   │   ├── format.ts
│   │   └── storage.ts
│   ├── types/               # TypeScript 类型
│   │   └── index.ts
│   └── App.tsx
├── public/                  # 静态资源
└── package.json
```

### API 请求

```typescript
// src/utils/api.ts
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function fetchMistakes() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/mistakes`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

export async function createMistake(data: MistakeData) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/mistakes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

### 状态管理 (Zustand)

```typescript
// src/stores/mistakeStore.ts
import { create } from 'zustand';
import { fetchMistakes, createMistake } from '../utils/api';

interface MistakeState {
  mistakes: Mistake[];
  loading: boolean;
  error: string | null;
  loadMistakes: () => Promise<void>;
  addMistake: (data: MistakeData) => Promise<void>;
}

export const useMistakeStore = create<MistakeState>((set) => ({
  mistakes: [],
  loading: false,
  error: null,

  loadMistakes: async () => {
    set({ loading: true });
    try {
      const result = await fetchMistakes();
      set({ mistakes: result.data, loading: false });
    } catch (error) {
      set({ error: '加载失败', loading: false });
    }
  },

  addMistake: async (data) => {
    const result = await createMistake(data);
    if (result.success) {
      set((state) => ({
        mistakes: [...state.mistakes, result.data]
      }));
    }
  }
}));
```

---

## 测试指南

### 运行测试

```bash
# 安装测试依赖
pip3 install pytest pytest-cov --break-system-packages

# 运行所有测试
python3 -m pytest tests/ -v

# 运行特定模块
python3 -m pytest tests/test_account.py -v
python3 -m pytest tests/test_mistakes.py -v

# 生成覆盖率报告
python3 -m pytest --cov=server tests/

# 仅运行失败测试
python3 -m pytest tests/ --lf
```

### 编写新测试

```python
# tests/test_example.py
import pytest
from server.handlers.example import handle_example_get, handle_example_post

class TestExample:
    """示例 Handler 测试"""

    def test_get_example_success(self, test_user):
        """正常获取示例数据"""
        params = {}
        status, result = handle_example_get(test_user['id'], params)

        assert status == 200
        assert result['success'] is True

    def test_get_example_not_logged_in(self):
        """未登录访问"""
        params = {}
        status, result = handle_example_get(None, params)

        assert status == 401
        assert result['success'] is False

    def test_post_example_validation(self, test_user):
        """参数验证"""
        data = {'name': ''}  # 缺少 value
        status, result = handle_example_post(test_user['id'], data)

        assert status == 400
        assert '缺少必填字段' in result['message']
```

### 测试最佳实践

1. **独立性**: 每个测试应该独立运行
2. **单一职责**: 一个测试只验证一个功能点
3. **命名清晰**: 测试函数名应说明测试场景
4. **使用 fixtures**: 复用测试数据准备
5. **边界条件**: 测试空值、极值、异常输入

---

## 部署流程

### 本地测试部署

```bash
# 1. 构建前端
cd mistake_system/mistake-system-desktop
npm run build

# 2. 启动服务
./start_all.sh start
```

### 生产部署

```bash
# 1. 配置环境变量
export LEARNING_SYSTEM_DIR=/opt/learning_system
export LEARNING_SYSTEM_PORT=8080
export LOG_LEVEL=INFO

# 2. 启动服务
python3 unified_server.py

# 3. 或使用 systemd
sudo systemctl start learning-system
```

详细部署指南请参考 [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 故障排除

### 常见问题

#### 1. 数据库连接错误

```
sqlite3.OperationalError: database is locked
```

**解决方案**:
- 确保正确使用 `conn.close()`
- 检查是否有其他进程占用数据库
- 考虑增加超时时间

#### 2. 前端构建失败

```
Error: Cannot find module 'vite'
```

**解决方案**:
```bash
cd mistake_system/mistake-system-desktop
rm -rf node_modules package-lock.json
npm install
```

#### 3. CORS 错误

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**解决方案**:
检查 `ALLOWED_ORIGIN` 环境变量是否设置正确。

#### 4. 端口被占用

```bash
# 查找占用端口的进程
sudo lsof -i :8080

# 终止进程
sudo kill -9 <PID>
```

### 调试技巧

#### 后端调试

```python
# 启用详细日志
export LOG_LEVEL=DEBUG

# 添加断点
import pdb; pdb.set_trace()
```

#### 前端调试

```typescript
// 查看网络请求
fetch('/api/mistakes')
  .then(r => r.json())
  .then(data => console.log('API Response:', data))
  .catch(err => console.error('API Error:', err));
```

---

## 贡献指南

### 提交规范

```
<type>: <subject>

<body>

<footer>
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:
```
feat: 添加错题批量导入功能

- 支持 CSV/Excel 文件导入
- 添加导入进度条
- 错误数据自动标记

Closes #123
```

### 代码审查清单

- [ ] 代码符合规范
- [ ] 已添加/更新测试
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 无安全漏洞
- [ ] 性能影响已评估

---

## 相关资源

- [API 文档](API_DOCS.md)
- [用户手册](USER_MANUAL.md)
- [部署指南](DEPLOYMENT.md)
- [架构文档](ARCHITECTURE.md)
- [故障排除](TROUBLESHOOTING.md)

---

*文档版本: 1.0*  
*最后更新: 2026-04-09*
