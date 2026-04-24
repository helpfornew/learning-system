# 学习平台模板

一个支持多学科的在线学习平台模板，具有涂鸦标注、进度追踪、多端同步等功能。

## 目录结构

```
.
├── index.html              # 学习平台主页（动态加载科目）
├── login.html              # 通用登录页
├── admin.html              # 管理后台（仅admin可访问）
├── config.js               # API 配置
├── app.py                  # Flask 后端 API
├── import_data.py          # 数据导入脚本（静态数据→数据库）
├── 部署教程.md              # 详细部署文档
├── database.db             # SQLite 数据库（运行时生成）
├── data/                   # 静态学科数据（可导入数据库）
│   ├── intro.js
│   ├── reaction.js
│   ├── metal.js
│   ├── nonmetal.js
│   ├── structure.js
│   ├── principle.js
│   ├── organic.js
│   ├── lab.js
│   ├── calculation.js
│   └── equations.js
└── template/               # 模板文件
```

## 快速开始

### 1. 访问学科选择页面

打开 `index.html`，选择要学习的学科：
- **化学**：高中化学核心知识 + 反应式实例
- **物理**：高中物理核心知识 + 公式推导

### 2. 添加新学科

现在通过 **Admin 管理后台** 添加新学科：

1. 访问 `http://localhost:5000/admin.html`
2. 使用 admin 账号登录（默认：`admin / admin123456`）
3. 点击「+ 添加科目」
4. 填写科目信息：
   - **科目标识**：英文，如 `math`
   - **科目名称**：如 `数学`
   - **Logo**：如 `Math`
   - **颜色**：主题色，如 `#10b981`
   - **描述**：科目简介
5. 保存后自动出现在科目下拉框中

然后添加章节：
1. 在管理后台选择新科目
2. 点击「+ 添加章节」
3. 填写章节信息（支持 HTML 内容）
4. 使用帮助面板中的样式类创建美观内容

### 3. 数据格式说明

每个章节的数据结构：

```javascript
const chapterKey = {
    title: "章节标题",
    description: "章节描述",
    content: `
        <div class="doc-section">
            <h2>小节标题</h2>
            <p>段落内容</p>
            <div class="formula-box">公式</div>
            <div class="code-block">代码</div>
            <table>
                <tr><th>表头</th></tr>
                <tr><td>内容</td></tr>
            </table>
            <div class="warning-note">警告提示</div>
            <div class="success-note">成功提示</div>
        </div>
    `
};
```

支持的 CSS 类：
- `.doc-section` - 文档区块
- `.formula-box` - 公式框
- `.code-block` - 代码块
- `.reaction-card` - 反应卡片
- `.warning-note` - 警告提示
- `.success-note` - 成功提示
- `table` - 表格（自动美化）

### 4. 功能特性

#### 学习功能
- **涂鸦标注**：支持画笔、荧光笔、橡皮擦，每章节独立保存
- **进度追踪**：标记已掌握的章节，自动同步到服务器
- **多端同步**：登录后自动同步进度和涂鸦
- **键盘快捷键**：
  - `←/→` - 切换章节
  - `Enter` - 标记掌握
  - `B/H/E` - 画笔/荧光笔/橡皮擦
  - `C` - 清除画布
  - `T` - 展开/收起工具栏
  - `Ctrl+S` - 保存涂鸦

#### 管理功能（Admin）
- **科目管理**：创建、编辑、删除科目
- **章节管理**：创建、编辑、删除章节
- **富文本编辑**：支持 HTML 内容，内置样式帮助
- **排序控制**：自定义章节显示顺序
- **软删除**：删除的数据保留在数据库中

**访问管理后台：**
1. 使用 admin 账号登录
2. 点击右上角用户头像
3. 选择「内容管理」

### 5. 后端 API

启动后端服务：

```bash
cd /home/user/learning-hx
python3 app.py
```

#### 公开接口（无需登录）

| 方法 | 接口 | 说明 |
|------|------|------|
| POST | `/api/register` | 用户注册 |
| POST | `/api/login` | 用户登录 |
| GET | `/api/health` | 健康检查 |
| GET | `/api/subjects` | 获取科目列表 |
| GET | `/api/subjects/{key}` | 获取科目详情（含章节） |
| GET | `/api/chapters/{key}` | 获取章节内容 |

#### 需要登录的接口

| 方法 | 接口 | 说明 |
|------|------|------|
| GET | `/api/user` | 获取当前用户信息 |
| POST | `/api/logout` | 登出 |
| GET | `/api/mastered` | 获取已掌握章节 |
| POST | `/api/mastered` | 标记/取消章节掌握 |
| GET | `/api/progress` | 获取阅读进度 |
| POST | `/api/progress` | 上报阅读进度 |
| GET | `/api/drawing/{chapter_key}` | 获取章节涂鸦 |
| POST | `/api/drawing` | 保存章节涂鸦 |
| DELETE | `/api/drawing/{chapter_key}` | 删除章节涂鸦 |

#### Admin 管理接口（需要管理员权限）

| 方法 | 接口 | 说明 |
|------|------|------|
| POST | `/api/admin/subjects` | 创建科目 |
| PUT | `/api/admin/subjects/{id}` | 更新科目 |
| DELETE | `/api/admin/subjects/{id}` | 删除科目（软删除） |
| POST | `/api/admin/chapters` | 创建章节 |
| PUT | `/api/admin/chapters/{id}` | 更新章节 |
| DELETE | `/api/admin/chapters/{id}` | 删除章节（软删除） |

**管理员账号：**
- 默认账号：`admin / admin123456`
- 登录后点击用户头像 → 「内容管理」进入后台

## 数据库设计

使用 SQLite 数据库，包含以下数据表：

### 表结构

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   users     │     │   subjects   │     │  chapters   │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)      │     │ id (PK)     │
│ username    │────▶│ key          │◀────│ subject_id  │
│ password_hash│    │ name         │     │ key         │
│ is_admin    │     │ logo         │     │ title       │
│ created_at  │     │ color        │     │ description │
└─────────────┘     │ description  │     │ content     │
                    │ sort_order   │     │ sort_order  │
┌──────────────┐    │ is_active    │     │ is_active   │
│reading_progress│   │ created_at   │     │ created_at  │
├──────────────┤    │ updated_at   │     │ updated_at  │
│ id (PK)      │    └──────────────┘     └─────────────┘
│ user_id (FK) │
│ chapter_key  │    ┌──────────────┐     ┌─────────────┐
│ last_read_at │    │canvas_drawings│    │mastered_chapters│
│ read_count   │    ├──────────────┤    ├─────────────┤
└──────────────┘    │ id (PK)      │    │ id (PK)     │
                    │ user_id (FK) │    │ user_id (FK)│
                    │ chapter_key  │    │ chapter_key │
                    │ drawing_data │    │ mastered_at │
                    │ updated_at   │    └─────────────┘
                    └──────────────┘
```

### 详细说明

#### 1. users - 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| username | TEXT | 用户名，唯一 |
| password_hash | TEXT | 密码哈希（werkzeug加密） |
| is_admin | INTEGER | 是否管理员（0=否，1=是） |
| created_at | TIMESTAMP | 创建时间 |

#### 2. subjects - 科目表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| key | TEXT | 科目标识（如：chemistry, physics） |
| name | TEXT | 科目名称 |
| logo | TEXT | Logo文字（如：Chem, Phys） |
| color | TEXT | 主题颜色（如：#4c9aff） |
| description | TEXT | 科目描述 |
| sort_order | INTEGER | 排序权重 |
| is_active | INTEGER | 是否启用（软删除标记） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### 3. chapters - 章节表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| subject_id | INTEGER | 所属科目ID（外键） |
| key | TEXT | 章节标识（如：intro, mole） |
| title | TEXT | 章节标题 |
| description | TEXT | 章节描述 |
| content | TEXT | 章节内容（HTML格式） |
| sort_order | INTEGER | 排序权重 |
| is_active | INTEGER | 是否启用（软删除标记） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### 4. reading_progress - 阅读记录表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户ID（外键） |
| chapter_key | TEXT | 章节标识 |
| last_read_at | TIMESTAMP | 最后阅读时间 |
| read_count | INTEGER | 阅读次数 |

#### 5. mastered_chapters - 掌握记录表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户ID（外键） |
| chapter_key | TEXT | 章节标识 |
| mastered_at | TIMESTAMP | 掌握时间 |

#### 6. canvas_drawings - 涂鸦数据表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户ID（外键） |
| chapter_key | TEXT | 章节标识 |
| drawing_data | TEXT | 涂鸦数据（Base64图片） |
| updated_at | TIMESTAMP | 更新时间 |

### 数据库初始化

首次运行会自动创建数据库，或手动执行：

```bash
python3 app.py
```

### 数据备份

```bash
# 备份数据库
cp database.db database_backup_$(date +%Y%m%d).db

# 导出数据
sqlite3 database.db ".dump" > backup.sql
```

## 部署教程

详细部署说明请参考 [部署教程.md](./部署教程.md)

## 技术栈

- 前端：纯 HTML + CSS + JavaScript（无框架依赖）
- 后端：Python Flask + SQLite
- 绘图：HTML5 Canvas API

## 许可证

MIT License
