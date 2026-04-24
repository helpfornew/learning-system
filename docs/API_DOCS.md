# 高考学习系统 API 文档

本文档描述了高考学习系统的 REST API 接口。

**基础 URL**: `http://localhost:8080`  
**认证方式**: Bearer Token (Authorization: Bearer {token}) 或 URL 参数 (?token={token})

---

## 目录

- [通用规范](#通用规范)
- [认证接口](#认证接口)
- [用户接口](#用户接口)
- [错题管理](#错题管理)
- [单词本](#单词本)
- [学习时间表](#学习时间表)
- [学习时间跟踪](#学习时间跟踪)
- [学习平台](#学习平台)
- [用户配置](#用户配置)
- [AI 配置](#ai-配置)
- [个性化学习分析](#个性化学习分析)

---

## 通用规范

### 响应格式

所有 API 响应均为 JSON 格式，统一结构如下：

```json
{
  "success": true|false,
  "data": { ... },           // 成功时返回的数据
  "message": "...",          // 成功或失败的提示信息
  "error": "..."             // 失败时的错误信息
}
```

### HTTP 状态码

| 状态码 | 含义 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证/Token 无效 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复key） |
| 500 | 服务器内部错误 |

### 认证头

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

或在 URL 中传递：
```
GET /api/mistakes?token=eyJhbGciOiJIUzI1NiIs...
```

---

## 认证接口

### POST /account/api/register

用户注册（需要邀请码）

**请求体**:
```json
{
  "username": "string",      // 必填，用户名
  "password": "string",      // 必填，密码
  "invite_code": "string"    // 必填，邀请码
}
```

**响应示例** (200):
```json
{
  "success": true,
  "message": "注册成功，已获得30天VIP权限",
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "",
    "vip_level": 1,
    "expires_at": "2026-05-09T10:00:00"
  },
  "vip_days": 30
}
```

**错误响应**:
- 400: 缺少必要字段 / 用户已存在 / 邀请码无效或已过期

---

### POST /account/api/login

用户登录

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应示例** (200):
```json
{
  "success": true,
  "message": "登录成功",
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "",
    "vip_level": 1,
    "expires_at": "2026-05-09T10:00:00"
  }
}
```

**错误响应**:
- 400: 用户名或密码为空
- 401: 用户名或密码错误

---

### GET /account/api/user

获取当前登录用户信息

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "",
    "vip_level": 1,
    "expires_at": "2026-05-09T10:00:00"
  }
}
```

---

## 用户接口

### POST /account/api/invite-code

创建邀请码（仅VIP用户，vip_level >= 1）

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "max_uses": 10,           // 最大使用次数，0表示无限制
  "remark": "给某某的邀请码"  // 备注
}
```

**响应示例** (200):
```json
{
  "success": true,
  "message": "邀请码已生成",
  "code": "ABC123DEF456"
}
```

---

## 错题管理

### GET /api/mistakes

获取当前用户的所有错题

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "subject_id": 1,
      "content": "题目内容...",
      "wrong_answer": "错误答案",
      "correct_answer": "正确答案",
      "error_reason": "错误原因",
      "analysis": "解析...",
      "knowledge_points": "[\"知识点1\", \"知识点2\"]",
      "tags": "[\"标签1\", \"标签2\"]",
      "difficulty": 2,
      "images_path": "/images/1/mistake_1_20250101_120000.jpg",
      "created_at": "2026-01-01 12:00:00",
      "is_deleted": 0,
      "review_count": 0,
      "last_review_date": null,
      "next_review_date": null
    }
  ]
}
```

---

### POST /api/mistakes

创建新错题

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "subject_id": 1,              // 科目ID，必填
  "content": "题目内容",         // 题目内容，必填
  "wrong_answer": "错误答案",    // 错误答案
  "correct_answer": "正确答案",  // 正确答案
  "error_reason": "错误原因",
  "analysis": "解析内容",
  "knowledge_points": ["知识点1", "知识点2"],
  "tags": ["标签1", "标签2"],
  "difficulty": 2,              // 难度 1-5，默认2
  "images_path": "data:image/jpeg;base64,/9j/4AAQ..."  // Base64图片数据
}
```

**响应示例** (200):
```json
{
  "success": true,
  "id": 123
}
```

---

### PUT /api/mistakes/{id}

更新错题

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "content": "更新后的题目内容",
  "wrong_answer": "更新后的错误答案",
  "correct_answer": "更新后的正确答案",
  "error_reason": "更新后的错误原因",
  "analysis": "更新后的解析",
  "knowledge_points": ["新知识点"],
  "tags": ["新标签"],
  "difficulty": 3,
  "images_path": "data:image/jpeg;base64,..."
}
```

**响应示例** (200):
```json
{
  "success": true
}
```

**错误响应**:
- 404: 错题不存在或无权限

---

### DELETE /api/mistakes/{id}

删除错题

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true
}
```

---

## 单词本

### GET /api/vocabulary

获取当前用户的单词列表

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "word": "apple",
      "phonetic": "/ˈæp.l/",
      "definition": "苹果",
      "example_sentence": "I eat an apple every day.",
      "example_translation": "我每天吃一个苹果。",
      "part_of_speech": "noun",
      "tags": "[\"水果\", \"日常\"]",
      "difficulty_level": 1,
      "status": "new",
      "熟练度": 0,
      "next_review": null,
      "review_count": 0,
      "last_reviewed": null,
      "created_at": "2026-01-01 12:00:00"
    }
  ]
}
```

---

### POST /api/vocabulary

添加新单词

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "word": "apple",                    // 必填，单词
  "phonetic": "/ˈæp.l/",              // 音标
  "definition": "苹果",                // 必填，释义
  "example_sentence": "I eat an apple every day.",
  "part_of_speech": "noun",
  "tags": ["水果", "日常"]
}
```

**响应示例** (200):
```json
{
  "success": true,
  "id": 123
}
```

---

### PUT /api/vocabulary/{id}

更新单词

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "definition": "新的释义"
}
```

**响应示例** (200):
```json
{
  "success": true
}
```

---

### DELETE /api/vocabulary/{id}

删除单词

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true
}
```

---

### POST /api/vocabulary-review

记录单词复习

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "word_id": 123,
  "result": "mastered"  // mastered|forgot|vague
}
```

---

### POST /api/vocabulary-batch

批量导入单词

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "words": [
    {"word": "apple", "definition": "苹果"},
    {"word": "banana", "definition": "香蕉"}
  ]
}
```

**响应示例** (200):
```json
{
  "success": true,
  "imported": 2
}
```

---

## 学习时间表

### GET /api/schedule

获取用户完整周时间表

**请求头**: `Authorization: Bearer {token}`

**查询参数**:
- `day` (可选): 0-6，只获取指定日期的时间表

**响应示例** (200):
```json
{
  "success": true,
  "data": {
    "0": [  // 周日
      {"start": "07:00", "end": "07:20", "title": "起床洗漱", "desc": "...", "subject": "⏰ 起床", "tag": "daily"}
    ],
    "1": [  // 周一
      {"start": "09:00", "end": "10:30", "title": "🔴 化学分块输入", "desc": "...", "subject": "化学", "tag": "学习"}
    ]
  },
  "source": "mixed"  // mixed|user|default
}
```

---

### GET /api/schedule/today

获取今日时间表

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true,
  "data": [...],
  "day": 1,
  "source": "user"
}
```

---

### POST /api/schedule

保存/更新某天时间表

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "day": 1,  // 0-6，0=周日
  "schedule": [
    {
      "start": "09:00",
      "end": "10:30",
      "title": "化学学习",
      "desc": "化学分块输入学习",
      "subject": "化学",
      "tag": "学习"
    }
  ]
}
```

**响应示例** (200):
```json
{
  "success": true,
  "message": "时间表保存成功",
  "day": 1
}
```

---

### PUT /api/schedule/today

更新今日时间表

**请求头**: `Authorization: Bearer {token}`

**请求体**: 同 POST /api/schedule，不需要 day 字段

**响应示例** (200):
```json
{
  "success": true,
  "message": "今日时间表更新成功",
  "day": 1
}
```

---

### DELETE /api/schedule/{day}

删除某天时间表（恢复默认）

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true,
  "message": "时间表已删除"
}
```

---

## 学习时间跟踪

### GET /api/study-time

获取学习时间记录

**请求头**: `Authorization: Bearer {token}`

**查询参数**:
- `date` (可选): 日期格式 YYYY-MM-DD，默认今天

**响应示例** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "subject": "化学",
      "duration": 90.5,
      "date": "2026-01-01",
      "created_at": "2026-01-01T12:00:00"
    }
  ]
}
```

---

### POST /api/study-time

添加学习时间记录

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "subject": "化学",      // 必填，科目名称
  "duration": 90.5,       // 必填，学习时长（分钟）
  "date": "2026-01-01"    // 可选，默认今天
}
```

**响应示例** (200):
```json
{
  "success": true,
  "id": 123
}
```

---

## 学习平台

### GET /learning/api/subjects

获取所有科目列表

**响应示例** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "chemistry",
      "name": "化学",
      "logo": "⚗️",
      "color": "#4c9aff",
      "description": "高中化学核心知识",
      "sort_order": 1,
      "is_active": true
    }
  ]
}
```

---

### GET /learning/api/subjects/{key}

获取科目详情及章节列表

**响应示例** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "key": "chemistry",
    "name": "化学",
    "logo": "⚗️",
    "color": "#4c9aff",
    "description": "高中化学核心知识",
    "chapters": [
      {
        "id": 1,
        "key": "chapter-1",
        "title": "第一章：原子结构",
        "description": "原子核外电子排布",
        "sort_order": 1
      }
    ]
  }
}
```

---

### GET /learning/api/chapters/{key}

获取章节详情

**响应示例** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "key": "chapter-1",
    "title": "第一章：原子结构",
    "description": "原子核外电子排布",
    "content": "章节详细内容...",
    "subject_key": "chemistry",
    "subject_name": "化学"
  }
}
```

---

### GET /learning/api/progress

获取用户阅读进度

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true,
  "data": [
    {
      "chapter_key": "chapter-1",
      "last_read_at": "2026-01-01T12:00:00",
      "read_count": 3
    }
  ]
}
```

---

### POST /learning/api/progress

更新阅读进度

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "chapter_key": "chapter-1"  // 必填
}
```

**响应示例** (200):
```json
{
  "success": true,
  "message": "阅读记录已更新"
}
```

---

### GET /learning/api/mastered

获取已掌握章节列表

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true,
  "data": [
    {
      "chapter_key": "chapter-1",
      "mastered_at": "2026-01-01T12:00:00"
    }
  ]
}
```

---

### POST /learning/api/mastered

切换章节掌握状态

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "chapter_key": "chapter-1"  // 必填
}
```

**响应示例** (200):
```json
{
  "success": true,
  "mastered": true,  // 当前是否已掌握
  "message": "已标记为掌握"
}
```

---

### GET /learning/api/drawing/{chapter_key}

获取章节涂鸦数据

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true,
  "data": {
    "chapter_key": "chapter-1",
    "drawing_data": "{\"strokes\": [...]}",
    "updated_at": "2026-01-01T12:00:00"
  }
}
```

---

### POST /learning/api/drawing

保存章节涂鸦数据

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "chapter_key": "chapter-1",
  "drawing_data": "{\"strokes\": [...]}"
}
```

**响应示例** (200):
```json
{
  "success": true,
  "message": "涂鸦已保存"
}
```

---

### DELETE /learning/api/drawing/{chapter_key}

删除章节涂鸦

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true,
  "message": "涂鸦已清除"
}
```

---

### Admin 接口

以下接口需要管理员权限（vip_level >= 9）

#### POST /learning/api/admin/subjects

创建科目

**请求体**:
```json
{
  "key": "chemistry",           // 必填，唯一标识
  "name": "化学",                // 必填
  "logo": "⚗️",                  // 必填
  "color": "#4c9aff",           // 必填
  "description": "高中化学",
  "sort_order": 1
}
```

---

#### PUT /learning/api/admin/subjects/{id}

更新科目

**请求体**: 同上，key 不可修改

---

#### DELETE /learning/api/admin/subjects/{id}

删除科目（软删除）

---

#### POST /learning/api/admin/chapters

创建章节

**请求体**:
```json
{
  "subject_id": 1,           // 必填，所属科目ID
  "key": "chapter-1",        // 必填，唯一标识
  "title": "第一章",          // 必填
  "description": "章节描述",
  "content": "章节内容...",    // 必填
  "sort_order": 1
}
```

---

#### PUT /learning/api/admin/chapters/{id}

更新章节

---

#### DELETE /learning/api/admin/chapters/{id}

删除章节（软删除）

---

## 用户配置

### GET /api/config

获取用户配置（无需登录返回默认配置）

**请求头**: `Authorization: Bearer {token}` (可选)

**响应示例** (200):
```json
{
  "success": true,
  "data": {
    "targetDate": "2026-06-07",
    "countdownDays": 90,
    "totalTarget": 540
  },
  "source": "user"  // user|system|default
}
```

---

### POST /api/config

保存用户配置

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "targetDate": "2026-06-07",
  "countdownDays": 90,
  "totalTarget": 540
}
```

**响应示例** (200):
```json
{
  "success": true
}
```

---

## AI 配置

### GET /api/ai-config

获取用户的 AI 配置

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true,
  "data": {
    "deepseek": {
      "apiKey": "sk-...",
      "endpoint": "https://api.deepseek.com/v1",
      "model": "deepseek-chat",
      "enabled": true,
      "maxTokens": 2000,
      "temperature": 0.7,
      "updatedAt": "2026-01-01T12:00:00"
    }
  }
}
```

---

### POST /api/ai-config

保存 AI 配置

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "provider": "deepseek",           // 必填，AI提供商
  "apiKey": "sk-...",
  "endpoint": "https://api.deepseek.com/v1",
  "model": "deepseek-chat",
  "enabled": true,
  "maxTokens": 2000,
  "temperature": 0.7
}
```

**响应示例** (200):
```json
{
  "success": true,
  "message": "保存成功"
}
```

---

### DELETE /api/ai-config/{provider}

删除 AI 配置

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

## 个性化学习分析

### GET /api/weekly-analysis

获取用户的周分析历史

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "2026-W01",
      "timestamp": "2026-01-01T12:00:00",
      "totalMistakes": 50,
      "analyzedMistakes": 45,
      "moduleStats": [
        {"name": "化学", "count": 20, "percentage": 40}
      ],
      "personalizedAnalysis": {
        "strengths": ["优势领域..."],
        "weaknesses": ["薄弱环节..."],
        "suggestions": ["建议..."]
      }
    }
  ]
}
```

---

### POST /api/weekly-analysis

保存周分析结果

**请求头**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "weekId": "2026-W01",
  "totalMistakes": 50,
  "analyzedMistakes": 45,
  "moduleStats": [
    {"name": "化学", "count": 20, "percentage": 40}
  ],
  "personalizedAnalysis": {
    "strengths": ["优势..."],
    "weaknesses": ["薄弱..."],
    "suggestions": ["建议..."]
  }
}
```

**响应示例** (200):
```json
{
  "success": true,
  "message": "保存成功"
}
```

---

### DELETE /api/weekly-analysis/{week_id}

删除周分析

**请求头**: `Authorization: Bearer {token}`

**响应示例** (200):
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

## 健康检查

### GET /api/health

服务器健康检查

**响应示例** (200):
```json
{
  "status": "ok",
  "time": "2026-01-01T12:00:00"
}
```

---

## 数据模型

### 错题 (Mistake)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| user_id | integer | 用户ID |
| subject_id | integer | 科目ID |
| content | text | 题目内容 |
| wrong_answer | text | 错误答案 |
| correct_answer | text | 正确答案 |
| error_reason | text | 错误原因 |
| analysis | text | 解析 |
| knowledge_points | text | 知识点（JSON数组字符串） |
| tags | text | 标签（JSON数组字符串） |
| difficulty | integer | 难度 1-5 |
| images_path | text | 图片路径或Base64 |
| created_at | datetime | 创建时间 |
| is_deleted | boolean | 是否删除 |
| review_count | integer | 复习次数 |
| last_review_date | text | 最后复习日期 |
| next_review_date | text | 下次复习日期 |

### 用户 (User)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| username | text | 用户名 |
| password_hash | text | 密码哈希 |
| salt | text | 密码盐值 |
| email | text | 邮箱 |
| vip_level | integer | VIP等级 |
| status | text | 状态（active/blocked） |
| expires_at | datetime | VIP到期时间 |
| created_at | datetime | 创建时间 |
| last_login | datetime | 最后登录时间 |

---

## 错误处理

### 通用错误格式

```json
{
  "success": false,
  "message": "错误提示信息",
  "error": "详细错误描述"
}
```

### 认证错误

当 Token 无效或过期时，返回 401：

```json
{
  "success": false,
  "message": "未登录"
}
```

### 权限错误

当用户无权限访问资源时，返回 403：

```json
{
  "success": false,
  "error": "需要管理员权限"
}
```

### 资源不存在

当请求的资源不存在时，返回 404：

```json
{
  "success": false,
  "message": "错题不存在或无权限"
}
```

---

*文档版本: 1.0*  
*最后更新: 2026-04-09*
