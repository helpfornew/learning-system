# 高考学习系统 - 现代化UI设计规范

## 1. 设计理念

### 1.1 设计原则
- **护眼优先**: 长时间学习场景，避免高对比度刺眼配色
- **专注学习**: 减少视觉干扰，内容优先
- **现代简洁**: 扁平化设计，适度圆角，柔和阴影
- **一致性**: 四个子系统统一视觉语言

### 1.2 色彩心理学
- 主色调选择蓝绿色系：代表冷静、专注、信任
- 辅助色使用暖色调：用于强调和激励
- 背景色偏暖灰：比纯白更护眼

---

## 2. 配色方案

### 2.1 浅色模式 (Light Mode)

#### 主色调
| 名称 | 色值 | 用途 |
|------|------|------|
| Primary | `#2563eb` | 主按钮、链接、强调 |
| Primary Hover | `#1d4ed8` | 主按钮悬停 |
| Primary Light | `#dbeafe` | 浅色背景、标签 |
| Primary Dark | `#1e40af` | 深色强调 |

#### 辅助色
| 名称 | 色值 | 用途 |
|------|------|------|
| Success | `#10b981` | 成功状态、已掌握 |
| Success Light | `#d1fae5` | 成功背景 |
| Warning | `#f59e0b` | 警告、需复习 |
| Warning Light | `#fef3c7` | 警告背景 |
| Danger | `#ef4444` | 错误、删除 |
| Danger Light | `#fee2e2` | 错误背景 |
| Info | `#06b6d4` | 信息提示 |
| Info Light | `#cffafe` | 信息背景 |

#### 学科主题色
| 学科 | 色值 | 用途 |
|------|------|------|
| 化学 | `#8b5cf6` | 化学相关元素 |
| 数学 | `#3b82f6` | 数学相关元素 |
| 物理 | `#06b6d4` | 物理相关元素 |
| 语文 | `#f59e0b` | 语文相关元素 |
| 英语 | `#ec4899` | 英语相关元素 |
| 政治 | `#10b981` | 政治相关元素 |

#### 中性色
| 名称 | 色值 | 用途 |
|------|------|------|
| Background | `#f8fafc` | 页面背景 |
| Surface | `#ffffff` | 卡片、面板背景 |
| Surface Alt | `#f1f5f9` | 交替背景、hover |
| Border | `#e2e8f0` | 边框、分割线 |
| Border Light | `#f1f5f9` | 浅色边框 |
| Text Primary | `#0f172a` | 主要文字 |
| Text Secondary | `#475569` | 次要文字 |
| Text Tertiary | `#94a3b8` | 辅助文字、placeholder |
| Text Inverse | `#ffffff` | 深色背景上的文字 |

### 2.2 深色模式 (Dark Mode)

#### 主色调
| 名称 | 色值 | 用途 |
|------|------|------|
| Primary | `#3b82f6` | 主按钮、链接 |
| Primary Hover | `#60a5fa` | 主按钮悬停 |
| Primary Light | `#1e3a8a` | 深色背景强调 |

#### 中性色
| 名称 | 色值 | 用途 |
|------|------|------|
| Background | `#0f172a` | 页面背景 |
| Surface | `#1e293b` | 卡片、面板背景 |
| Surface Alt | `#334155` | 交替背景、hover |
| Border | `#334155` | 边框、分割线 |
| Border Light | `#475569` | 浅色边框 |
| Text Primary | `#f1f5f9` | 主要文字 |
| Text Secondary | `#cbd5e1` | 次要文字 |
| Text Tertiary | `#64748b` | 辅助文字 |

---

## 3. 布局规范

### 3.1 间距系统 (Spacing)
以 4px 为基准单位：

| Token | 值 | 用途 |
|-------|-----|------|
| space-1 | 4px | 图标间距、紧凑内联 |
| space-2 | 8px | 小间距、行内元素 |
| space-3 | 12px | 按钮内边距、小卡片 |
| space-4 | 16px | 标准间距、卡片内边距 |
| space-5 | 20px | 中等间距 |
| space-6 | 24px | 大间距、区块间距 |
| space-8 | 32px | 大区块间距 |
| space-10 | 40px | 页面级间距 |
| space-12 | 48px | 大区块间距 |

### 3.2 圆角系统 (Border Radius)

| Token | 值 | 用途 |
|-------|-----|------|
| radius-sm | 4px | 小标签、紧凑元素 |
| radius-md | 8px | 按钮、输入框、小卡片 |
| radius-lg | 12px | 卡片、面板、模态框 |
| radius-xl | 16px | 大卡片、浮层 |
| radius-2xl | 24px | 特殊强调元素 |
| radius-full | 9999px | 圆形按钮、头像、标签 |

### 3.3 阴影系统 (Shadow)

| Token | 值 | 用途 |
|-------|-----|------|
| shadow-sm | `0 1px 2px rgba(0,0,0,0.05)` | 轻微凸起 |
| shadow-md | `0 4px 6px -1px rgba(0,0,0,0.1)` | 卡片、按钮 |
| shadow-lg | `0 10px 15px -3px rgba(0,0,0,0.1)` | 浮层、下拉菜单 |
| shadow-xl | `0 20px 25px -5px rgba(0,0,0,0.1)` | 模态框、对话框 |
| shadow-glow | `0 0 20px rgba(37,99,235,0.3)` | 主按钮发光效果 |

---

## 4. 组件规范

### 4.1 按钮 (Button)

#### 主按钮 (Primary)
```css
.btn-primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px -2px rgba(37, 99, 235, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### 次要按钮 (Secondary)
```css
.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}
```

#### 幽灵按钮 (Ghost)
```css
.btn-ghost {
  background: transparent;
  color: #475569;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: #f1f5f9;
}
```

#### 危险按钮 (Danger)
```css
.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);
}
```

### 4.2 卡片 (Card)

```css
.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}
```

### 4.3 输入框 (Input)

```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #0f172a;
  background: #ffffff;
  transition: all 0.2s ease;
}

.input:hover {
  border-color: #cbd5e1;
}

.input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input::placeholder {
  color: #94a3b8;
}
```

### 4.4 标签 (Tag)

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
}

.tag-primary {
  background: #dbeafe;
  color: #1d4ed8;
}

.tag-success {
  background: #d1fae5;
  color: #059669;
}

.tag-warning {
  background: #fef3c7;
  color: #d97706;
}

.tag-danger {
  background: #fee2e2;
  color: #dc2626;
}
```

### 4.5 导航栏 (Navbar)

```css
.navbar {
  background: #ffffff;
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-brand {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  color: #475569;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: #2563eb;
  background: #f1f5f9;
}

.nav-link.active {
  color: #2563eb;
  background: #dbeafe;
}
```

### 4.6 侧边栏 (Sidebar)

```css
.sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  height: calc(100vh - 64px);
  overflow-y: auto;
  padding: 16px 0;
}

.sidebar-item {
  padding: 12px 20px;
  margin: 2px 12px;
  border-radius: 8px;
  color: #475569;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.sidebar-item.active {
  background: #dbeafe;
  color: #2563eb;
  font-weight: 600;
}
```

---

## 5. 字体与排版

### 5.1 字体栈
```css
/* 中文优先 */
font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* 代码/数字 */
font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
```

### 5.2 字号系统

| 级别 | 大小 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| H1 | 32px | 40px | 700 | 页面标题 |
| H2 | 24px | 32px | 700 | 区块标题 |
| H3 | 20px | 28px | 600 | 卡片标题 |
| H4 | 18px | 24px | 600 | 小标题 |
| Body | 14px | 22px | 400 | 正文 |
| Body Large | 16px | 24px | 400 | 大正文 |
| Small | 12px | 18px | 400 | 辅助文字 |
| Caption | 11px | 16px | 500 | 标签、徽章 |

### 5.3 字重
- **400 (Regular)**: 正文、描述
- **500 (Medium)**: 导航、按钮
- **600 (Semibold)**: 标题、强调
- **700 (Bold)**: 大标题、重要数字

---

## 6. 动画与过渡

### 6.1 过渡时间
```css
--transition-fast: 150ms;
--transition-normal: 200ms;
--transition-slow: 300ms;
--transition-slower: 500ms;
```

### 6.2 缓动函数
```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 6.3 常用动画
```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 滑入 */
@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* 脉冲 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 旋转 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 7. 响应式断点

| 断点 | 宽度 | 用途 |
|------|------|------|
| sm | 640px | 手机横屏 |
| md | 768px | 平板竖屏 |
| lg | 1024px | 平板横屏/小桌面 |
| xl | 1280px | 桌面 |
| 2xl | 1536px | 大桌面 |

---

## 8. 可访问性规范

### 8.1 对比度
- 正文文字与背景对比度至少 4.5:1
- 大文字（18px+ 或 14px+ bold）对比度至少 3:1
- 交互元素对比度至少 3:1

### 8.2 焦点状态
```css
:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

### 8.3 减少动画
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. 各子系统适配建议

### 9.1 错题系统 (React + Electron)
- 使用 Ant Design 主题定制实现设计规范
- 配置 ConfigProvider 统一组件样式
- 深色模式通过 CSS 变量切换

### 9.2 单词卡系统 (HTML/CSS)
- 直接应用上述 CSS 变量
- 使用渐变背景增加视觉层次
- 卡片翻转动画使用 CSS 3D transform

### 9.3 化学学习平台 (HTML/CSS)
- 侧边栏使用新配色
- 代码块保持深色主题
- 公式使用学科主题色高亮

### 9.4 统一配置/主页系统 (HTML/CSS)
- 仪表盘卡片使用新阴影系统
- 统计数字使用大号字体
- 进度条使用渐变色彩

---

## 10. CSS 变量定义

```css
:root {
  /* 主色 */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-light: #dbeafe;
  --color-primary-dark: #1e40af;

  /* 功能色 */
  --color-success: #10b981;
  --color-success-light: #d1fae5;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-danger: #ef4444;
  --color-danger-light: #fee2e2;
  --color-info: #06b6d4;
  --color-info-light: #cffafe;

  /* 中性色 */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-alt: #f1f5f9;
  --color-border: #e2e8f0;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-tertiary: #94a3b8;

  /* 间距 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;

  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);

  /* 过渡 */
  --transition-fast: 150ms;
  --transition-normal: 200ms;
}

/* 深色模式 */
[data-theme="dark"] {
  --color-primary: #3b82f6;
  --color-primary-hover: #60a5fa;
  --color-primary-light: #1e3a8a;

  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-surface-alt: #334155;
  --color-border: #334155;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #cbd5e1;
  --color-text-tertiary: #64748b;
}
```

---

## 11. 实施优先级

### 高优先级
1. 更新主色调（替换米色/棕色）
2. 统一按钮样式
3. 更新卡片阴影和圆角

### 中优先级
1. 更新导航栏样式
2. 统一输入框样式
3. 更新标签/徽章样式

### 低优先级
1. 添加深色模式支持
2. 优化动画效果
3. 微调间距细节
