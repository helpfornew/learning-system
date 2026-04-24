# 高考错题系统桌面版

一款专为高考学生设计的错题管理桌面应用，帮助您高效整理、复习错题，提升学习效率。

## 功能特性

- **错题管理**: 支持多科目错题录入、分类和管理
- **AI分析**: 利用AI技术自动分析错题知识点和难度
- **数据分析**: 可视化图表展示学习进度和薄弱环节
- **个性化学习计划**: 基于错题数据生成定制化学习建议
- **复习计划**: 智能安排复习时间和间隔
- **多AI提供商支持**: 支持OpenAI、DeepSeek、通义千问等多种AI服务
- **数据导入导出**: 支持学习数据备份和迁移
- **时间管理**: 记录学习时间，制定合理学习计划

## 技术栈

- **前端框架**: React 18 + TypeScript
- **UI库**: Ant Design
- **图表库**: ECharts for React
- **桌面框架**: Electron
- **构建工具**: Vite
- **状态管理**: React Hooks + localStorage
- **网络请求**: Axios

## 快捷键

- `F2`: 快速录入错题
- `F3`: 开始今日复习
- `F4`: 打开数据分析
- `F5`: 刷新页面

## 安装与启动

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动Electron应用
npm run electron:dev
```

### 生产环境

```bash
# 构建Web版本
npm run build

# 构建Electron桌面应用
npm run electron:build

# 构建特定平台
npm run build:win    # Windows
npm run build:mac    # Mac
npm run build:linux  # Linux
```

## 配置说明

### AI服务配置

本系统支持多种AI服务提供商，包括：

1. **OpenAI**: 需要在设置页面配置API Key
2. **DeepSeek**: 需要配置DeepSeek API Key
3. **通义千问**: 需要配置阿里云DashScope API Key

在设置页面中，您可以选择默认的AI提供商并配置相应的API密钥。

### 个性化设置

- 学习目标设定（总分目标、各科目标）
- 复习计划配置（复习间隔算法、重复阈值等）
- 通知设置（学习提醒、成就解锁等）
- 服务器配置（自定义API服务器）

## 项目结构

```
mistake-system-desktop/
├── electron/           # Electron主进程代码
├── src/
│   ├── components/     # 可复用UI组件
│   ├── pages/          # 页面组件
│   ├── services/       # 业务逻辑服务
│   ├── config/         # 配置文件
│   ├── styles/         # CSS样式
│   └── types/          # TypeScript类型定义
├── resources/          # 应用资源
└── uploads/            # 上传文件目录
```

## 部署说明

构建完成后，Web版本位于`dist/`目录，可以直接部署到任何静态服务器。

Electron桌面应用构建产物位于`release/`目录。

## 贡献

欢迎提交Issue和Pull Request来改进此项目。

## 许可证

本项目为商业许可证项目，仅供授权用户使用。

---

如有问题或建议，请联系我们：
- 邮箱: support@mistake-system.com
- 网站: https://mistake-system.com