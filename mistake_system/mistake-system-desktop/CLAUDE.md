# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

这是一个基于React和Electron的桌面学习系统应用，帮助用户管理和从错误中学习（错题系统）。该应用具有现代化的UI设计，采用Ant Design组件库，并集成了AI分析工具。

## Architecture

- 前端: React with TypeScript
- UI库: Ant Design
- 构建系统: Vite
- 桌面框架: Electron
- 状态管理: React hooks和localStorage
- API客户端: Axios

## Key Components

- `src/App.tsx`: 主应用程序路由器和键盘快捷键处理器
- `src/components/Sidebar.tsx`: 导航侧边栏组件
- `src/pages/Dashboard.tsx`: 仪表板页面
- `src/pages/MistakeBook.tsx`: 错题本页面，包含AI分析功能
- `src/pages/DataAnalysis.tsx`: 数据分析页面，包含可视化图表
- `src/pages/PersonalizedLearningPlan.tsx`: 个性化学习计划页面
- `src/pages/ReviewPlan.tsx`: 复习计划页面
- `src/pages/Settings.tsx`: 设置页面，包含多个标签页
- `src/services/aiService.ts`: 集中式服务，用于管理多个AI提供商（DeepSeek、Qwen、OpenAI等）
- `src/services/deepseekAnalyzer.ts`: 个性化学习分析功能
- `src/config/api.ts`: API端点配置

## Key Features

1. **AI集成**: 支持多个AI提供商（DeepSeek、Qwen、OpenAI、Anthropic、Google Gemini）并可配置API设置
2. **错题分析**: AI驱动的错误答案分析及改进建议
3. **学习分析**: 学习模式分析和个性化推荐
4. **键盘快捷键**: F2快速录入，F3今日复习，F4数据分析，F5刷新等
5. **主题切换**: 暗色/亮色模式切换
6. **数据可视化**: 使用ECharts展示学习数据的图表
7. **个性化学习计划**: 基于AI分析的个性化学习建议和计划
8. **错题OCR**: 支持图像裁剪和OCR功能

## Common Development Tasks

运行开发服务器：
```bash
npm run dev
```

运行带Electron的开发模式：
```bash
npm run electron:dev
```

构建Web版本：
```bash
npm run build
```

构建Electron桌面应用：
```bash
npm run electron:build
```

构建特定平台的Electron应用：
```bash
npm run build:win    # Windows
npm run build:mac    # Mac
npm run build:linux  # Linux
```

## AI Configuration System

应用支持灵活的AI配置系统：
- 在"设置"页面中存储API密钥和设置
- 支持多个AI提供商（通过src/services/aiService.ts统一接口）
- 提供向后兼容的专门配置服务（如qianwenConfig和deepseekConfig）

## Important Patterns

- 键盘快捷键在App.tsx中全局处理
- 暗色模式状态在主App组件中管理并传递给子组件
- 数据持久化使用localStorage和数据库
- AI分析功能依赖外部API（DeepSeek、Qwen等）
- 组件结构：pages包含页面级组件，components包含可重用UI组件，services包含业务逻辑

## Data Structure

错题数据包含以下字段：
- id: 唯一标识符
- subject_id: 科目ID（数学、物理、化学等）
- content: 错题内容
- correct_answer: 正确答案
- wrong_answer: 错误答案
- error_reason: 错误原因
- knowledge_points: 知识点
- topic: 题目主题
- difficulty: 难度等级
- review_count: 复习次数
- next_review: 下次复习日期
- created_at: 创建时间

## UI/UX Features

- 侧边栏导航（仪表盘、错题本、数据分析、个性化学习计划、复习计划、设置）
- 错题列表和详细视图
- 数据可视化图表（饼图、柱状图等）
- 个性化学习建议和计划
- 快速输入模态框
- 错题图片上传和裁剪功能
- 多种主题颜色方案

## Database Structure

SQLite数据库包含错题相关表格，支持用户认证、错题数据、复习计划等功能。