# 高考学习系统 - 设计系统 v1.0

## 1. 设计理念

### 1.1 核心原则
- **护眼优先**: 长时间学习场景，减少视觉疲劳
- **现代简洁**: 去除过时元素，采用当代设计语言
- **一致性**: 跨所有子系统统一视觉体验
- **可访问性**: 符合 WCAG 2.1 AA 标准

### 1.2 设计关键词
`清新` `专注` `专业` `温和` `现代`

---

## 2. 色彩系统

### 2.1 主色调 - 蓝绿色系 (代表成长与冷静)

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| **Primary-50** | `#f0f9ff` | 极浅背景、hover 状态 |
| **Primary-100** | `#e0f2fe` | 浅色背景、选中状态 |
| **Primary-200** | `#bae6fd` | 边框、分割线 |
| **Primary-300** | `#7dd3fc` | 次要强调 |
| **Primary-400** | `#38bdf8` | 图标、装饰 |
| **Primary-500** | `#0ea5e9` | **主品牌色** |
| **Primary-600** | `#0284c7` | 按钮 hover |
| **Primary-700** | `#0369a1` | 深色强调 |
| **Primary-800** | `#075985` | 深色文字 |
| **Primary-900** | `#0c4a6e` | 最深色 |

### 2.2 辅助色 - 翡翠绿 (代表成功与进步)

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| **Success-50** | `#ecfdf5` | 成功状态背景 |
| **Success-100** | `#d1fae5` | 成功轻色 |
| **Success-500** | `#10b981` | **成功主色** |
| **Success-600** | `#059669` | 成功 hover |
| **Success-700** | `#047857` | 成功深色 |

### 2.3 警告与错误

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| **Warning-50** | `#fffbeb` | 警告背景 |
| **Warning-500** | `#f59e0b` | **警告主色** |
| **Warning-600** | `#d97706` | 警告 hover |
| **Error-50** | `#fef2f2` | 错误背景 |
| **Error-500** | `#ef4444` | **错误主色** |
| **Error-600** | `#dc2626` | 错误 hover |

### 2.4 背景色系统

#### 浅色模式 (Light Mode)

| 名称 | 色值 | 用途 |
|------|------|------|
| **Bg-Primary** | `#ffffff` | 主背景、卡片 |
| **Bg-Secondary** | `#f8fafc` | 次要背景、侧边栏 |
| **Bg-Tertiary** | `#f1f5f9` | 第三层背景、hover |
| **Bg-Gradient** | `linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%)` | 页面背景渐变 |

#### 深色模式 (Dark Mode)

| 名称 | 色值 | 用途 |
|------|------|------|
| **Bg-Dark-Primary** | `#0f172a` | 深色主背景 |
| **Bg-Dark-Secondary** | `#1e293b` | 深色次要背景 |
| **Bg-Dark-Tertiary** | `#334155` | 深色第三层 |
| **Bg-Dark-Gradient** | `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)` | 深色渐变 |

### 2.5 文字色彩

#### 浅色模式

| 名称 | 色值 | 用途 |
|------|------|------|
| **Text-Primary** | `#0f172a` | 主标题、重要文字 |
| **Text-Secondary** | `#475569` | 次要文字、描述 |
| **Text-Tertiary** | `#94a3b8` | 占位符、禁用 |
| **Text-Inverse** | `#ffffff` | 深色背景上的文字 |

#### 深色模式

| 名称 | 色值 | 用途 |
|------|------|------|
| **Text-Dark-Primary** | `#f8fafc` | 深色主文字 |
| **Text-Dark-Secondary** | `#cbd5e1` | 深色次要文字 |
| **Text-Dark-Tertiary** | `#64748b` | 深色占位符 |

### 2.6 边框与分割线

| 名称 | 色值 | 用途 |
|------|------|------|
| **Border-Light** | `#e2e8f0` | 浅色边框 |
| **Border-Medium** | `#cbd5e1` | 中等边框 |
| **Border-Dark** | `#334155` | 深色边框 |

---

## 3. 布局系统

### 3.1 间距规范 (Spacing)

```
基础单位: 4px

--space-1: 4px   (0.25rem)
--space-2: 8px   (0.5rem)
--space-3: 12px  (0.75rem)
--space-4: 16px  (1rem)
--space-5: 20px  (1.25rem)
--space-6: 24px  (1.5rem)
--space-8: 32px  (2rem)
--space-10: 40px (2.5rem)
--space-12: 48px (3rem)
--space-16: 64px (4rem)
```

### 3.2 圆角规范 (Border Radius)

```
--radius-sm: 4px    (小按钮、标签)
--radius-md: 8px    (按钮、输入框)
--radius-lg: 12px   (卡片、弹窗)
--radius-xl: 16px   (大卡片、模态框)
--radius-2xl: 24px  (特殊容器)
--radius-full: 9999px (圆形)
```

### 3.3 阴影规范 (Shadows)

```
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)
--shadow-glow: 0 0 20px rgba(14, 165, 233, 0.3)  (发光效果)
```

---

## 4. 字体系统

### 4.1 字体栈

```css
/* 中文优先 */
--font-sans: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;

/* 等宽字体 - 用于代码、数据 */
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;

/* 装饰字体 - 用于标题 */
--font-display: 'Inter', 'PingFang SC', sans-serif;
```

### 4.2 字号规范

| 级别 | 大小 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| **Hero** | 48px | 1.1 | 700 | 页面大标题 |
| **H1** | 32px | 1.2 | 700 | 页面标题 |
| **H2** | 24px | 1.3 | 600 | 区块标题 |
| **H3** | 20px | 1.4 | 600 | 小标题 |
| **H4** | 18px | 1.4 | 600 | 卡片标题 |
| **Body-Large** | 18px | 1.6 | 400 | 大段文字 |
| **Body** | 16px | 1.6 | 400 | 正文 |
| **Body-Small** | 14px | 1.5 | 400 | 次要文字 |
| **Caption** | 12px | 1.4 | 500 | 标签、注释 |

---

## 5. 组件规范

### 5.1 按钮 (Button)

#### 主按钮 (Primary)
```css
background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
color: #ffffff;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
transition: all 0.2s ease;

/* Hover */
background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);

/* Active */
transform: translateY(0);
box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2);
```

#### 次要按钮 (Secondary)
```css
background: #f1f5f9;
color: #475569;
border: 1px solid #e2e8f0;

/* Hover */
background: #e2e8f0;
color: #0f172a;
```

#### 成功按钮 (Success)
```css
background: linear-gradient(135deg, #10b981 0%, #059669 100%);
color: #ffffff;

/* Hover */
background: linear-gradient(135deg, #059669 0%, #047857 100%);
box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
```

#### 危险按钮 (Danger)
```css
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
color: #ffffff;

/* Hover */
background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
```

#### 幽灵按钮 (Ghost)
```css
background: transparent;
color: #0ea5e9;
border: 1px solid #0ea5e9;

/* Hover */
background: rgba(14, 165, 233, 0.1);
```

### 5.2 卡片 (Card)

```css
/* 基础卡片 */
.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

/* Hover 效果 */
.card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 深色模式 */
.card-dark {
  background: #1e293b;
  border-color: #334155;
}
```

### 5.3 输入框 (Input)

```css
.input {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  color: #0f172a;
  transition: all 0.2s ease;
}

.input:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  outline: none;
}

.input::placeholder {
  color: #94a3b8;
}

/* 深色模式 */
.input-dark {
  background: #0f172a;
  border-color: #334155;
  color: #f8fafc;
}
```

### 5.4 导航栏 (Navbar)

```css
.navbar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e2e8f0;
  height: 64px;
  padding: 0 24px;
}

/* 深色模式 */
.navbar-dark {
  background: rgba(15, 23, 42, 0.9);
  border-color: #334155;
}
```

### 5.5 侧边栏 (Sidebar)

```css
.sidebar {
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  width: 280px;
}

.sidebar-item {
  padding: 12px 20px;
  color: #475569;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.sidebar-item:hover {
  background: #e0f2fe;
  color: #0284c7;
}

.sidebar-item.active {
  background: #e0f2fe;
  border-left-color: #0ea5e9;
  color: #0284c7;
  font-weight: 600;
}
```

### 5.6 标签 (Tag/Badge)

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.tag-primary {
  background: #e0f2fe;
  color: #0284c7;
}

.tag-success {
  background: #d1fae5;
  color: #059669;
}

.tag-warning {
  background: #fef3c7;
  color: #d97706;
}

.tag-error {
  background: #fee2e2;
  color: #dc2626;
}
```

### 5.7 进度条 (Progress)

```css
.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9 0%, #10b981 100%);
  border-radius: 9999px;
  transition: width 0.3s ease;
}
```

---

## 6. 深色模式适配

### 6.1 CSS 变量切换方案

```css
:root {
  /* 浅色模式默认值 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --border-color: #e2e8f0;
}

[data-theme="dark"] {
  /* 深色模式 */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --border-color: #334155;
}

/* 使用变量 */
.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}
```

### 6.2 深色模式颜色映射

| 浅色 | 深色 |
|------|------|
| #ffffff | #0f172a |
| #f8fafc | #1e293b |
| #f1f5f9 | #334155 |
| #e2e8f0 | #475569 |
| #cbd5e1 | #64748b |
| #94a3b8 | #94a3b8 |
| #64748b | #cbd5e1 |
| #475569 | #e2e8f0 |
| #334155 | #f1f5f9 |
| #0f172a | #f8fafc |

---

## 7. 响应式设计

### 7.1 断点定义

```
--breakpoint-sm: 640px   (手机)
--breakpoint-md: 768px   (平板)
--breakpoint-lg: 1024px  (小桌面)
--breakpoint-xl: 1280px  (大桌面)
--breakpoint-2xl: 1536px (超大屏)
```

### 7.2 布局适配

#### 移动端 (< 768px)
- 导航栏高度: 56px
- 侧边栏: 隐藏，通过抽屉菜单访问
- 卡片: 单列全宽
- 字体大小: 整体缩小 10%
- 间距: 整体缩小 25%

#### 平板 (768px - 1024px)
- 导航栏高度: 60px
- 侧边栏: 可折叠 (240px)
- 卡片: 双列布局

#### 桌面 (> 1024px)
- 导航栏高度: 64px
- 侧边栏: 固定展开 (280px)
- 卡片: 根据内容自适应列数

---

## 8. 动效规范

### 8.1 过渡时间

```
--duration-instant: 0.1s (微交互)
--duration-fast: 0.15s (按钮、链接)
--duration-normal: 0.2s (卡片、弹窗)
--duration-slow: 0.3s (页面切换)
```

### 8.2 缓动函数

```
--ease-default: cubic-bezier(0.4, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### 8.3 常用动画

```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 滑入 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 脉冲 (用于通知) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 旋转 (用于加载) */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 9. 各子系统适配指南

### 9.1 错题系统 (React + Electron)

#### 主要改动
1. **全局背景**: 从 `linear-gradient(135deg, #f5f5dc 0%, #e8e4d9 100%)` 
   改为 `linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%)`

2. **导航栏**: 
   - 背景: `#ffffff` + `backdrop-filter: blur(10px)`
   - 文字: `#0f172a`
   - 主色强调: `#0ea5e9`

3. **卡片样式**:
   - 背景: `#ffffff`
   - 圆角: 12px
   - 阴影: `0 1px 3px rgba(0, 0, 0, 0.1)`

4. **统计卡片**:
   - 使用渐变色背景: `linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)`
   - 文字: `#ffffff`

### 9.2 单词卡系统 (HTML/CSS)

#### 主要改动
1. **页面背景**: `#f0f9ff` 或渐变
2. **单词卡片**:
   - 背景: `#ffffff`
   - 边框: `1px solid #e2e8f0`
   - 圆角: 16px
   - 阴影: `0 4px 6px rgba(0, 0, 0, 0.05)`

3. **状态标签**:
   - 已掌握: `#d1fae5` 背景 + `#059669` 文字
   - 需复习: `#fef3c7` 背景 + `#d97706` 文字
   - 新单词: `#e0f2fe` 背景 + `#0284c7` 文字

4. **按钮**:
   - 主按钮: 蓝色渐变
   - 成功按钮: 绿色渐变
   - 次要按钮: 灰色边框

### 9.3 化学学习平台 (HTML/CSS)

#### 主要改动
1. **导航栏**: 深蓝背景 `#0f172a` 改为玻璃态白色
2. **侧边栏**: 
   - 背景: `#f8fafc`
   - 选中: `#e0f2fe` + 左边框 `#0ea5e9`
3. **代码块**:
   - 背景: `#1e293b`
   - 文字: `#e2e8f0`
   - 圆角: 12px
4. **提示框**:
   - info: `#e0f2fe` 边框
   - warning: `#fef3c7` 边框
   - success: `#d1fae5` 边框

### 9.4 统一配置/主页系统 (HTML/CSS)

#### 主要改动
1. **登录页**:
   - 背景: 渐变 `linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%)`
   - 卡片: 白色 + 阴影
   - 按钮: 蓝色渐变

2. **主面板**:
   - 统计卡片: 使用新配色
   - 当前任务: 蓝色渐变背景
   - 课表: 白色卡片 + 蓝色强调

3. **时钟组件**:
   - 文字: `#0ea5e9`
   - 字体: JetBrains Mono

---

## 10. 旧配色对照表

| 旧值 | 新值 | 说明 |
|------|------|------|
| `#f5f5dc` / `#e8e4d9` (米色) | `#f0f9ff` / `#f8fafc` | 背景色改为清爽蓝白 |
| `#5c5c5c` (灰褐) | `#0f172a` / `#475569` | 文字色改为现代 slate |
| `#8b7355` (棕色) | `#0ea5e9` (蓝色) | 主强调色改为蓝色 |
| `#d4c4a8` (浅棕) | `#e0f2fe` (浅蓝) | 次要背景色 |
| `rgba(139,115,85,0.1)` | `rgba(14,165,233,0.1)` | 半透明强调色 |

---

## 11. 可访问性检查清单

- [ ] 文字对比度 >= 4.5:1 (正文)
- [ ] 大文字对比度 >= 3:1 (标题)
- [ ] 交互元素聚焦状态明显
- [ ] 支持键盘导航
- [ ] 支持屏幕阅读器
- [ ] 支持 prefers-color-scheme 媒体查询
- [ ] 动画可禁用 (prefers-reduced-motion)

---

## 12. 实现优先级

### P0 - 核心 (必须)
1. 替换主背景色 (去除米色)
2. 更新主强调色为蓝色
3. 统一卡片样式
4. 更新按钮样式

### P1 - 重要 (应该)
1. 更新导航栏样式
2. 统一侧边栏样式
3. 实现深色模式基础
4. 更新文字颜色

### P2 - 优化 (可以)
1. 添加动效
2. 响应式优化
3. 组件细节微调
4. 可访问性增强

---

*设计系统版本: 1.0*
*最后更新: 2025-04-09*
*作者: UI Designer*
