# 高考学习系统 - 统一桌面应用

这是一个集成了学习系统主页和错题管理系统的综合桌面应用程序，基于Electron构建。

## 特性

- **统一入口**: 学习系统主页作为桌面应用主窗口
- **单点登录**: 保持原有的SSO认证机制
- **错题系统集成**: 可以从主页面无缝访问错题管理系统
- **桌面功能**: 包含全局快捷键、系统托盘等原生功能
- **离线支持**: 在离线模式下提供基本功能

## 架构

应用整合了以下组件：
- 学习系统主页 (config/index.html) - 作为主入口
- 错题管理系统 (mistake_system/mistake-system-desktop) - 作为子系统
- 统一后端API (unified_server.py) - 提供后端服务

## 安装依赖

```bash
npm install
```

## 开发模式运行

```bash
npm run dev
```

## 构建应用

```bash
# 构建适用于当前平台的应用
npm run build

# 构建特定平台的应用
npm run build:linux    # Linux
npm run build:win      # Windows
npm run build:mac      # macOS
```

## 项目结构

```
desktop_app/
├── config/               # 配置文件和主页
│   └── index.html        # 学习系统主页
├── electron/             # Electron主进程代码
│   ├── main.js           # 主进程逻辑
│   ├── preload.js        # 预加载脚本
│   ├── toolLauncher.js   # 工具启动器
│   └── config.json       # 配置文件
├── resources/            # 资源文件
│   └── icons/            # 应用图标
└── package.json          # 项目配置
```

## 主要功能

1. **学习系统主页**: 应用启动时显示的主界面，提供统一登录和导航
2. **错题管理**: 从主页可直接跳转到错题系统，保持认证状态
3. **工具集成**: 集成时间跟踪、智能提醒等实用工具
4. **全局快捷键**:
   - F2: 快速录入错题
   - F3: 开始今日复习
   - F4: 打开数据分析

## 注意事项

- 应用依赖于本地运行的统一服务器 (unified_server.py)
- 在首次使用前，请确保已启动后端服务
- 认证令牌将在应用会话期间保持有效

## 后续改进

- 增加更多集成功能
- 优化桌面应用性能
- 增加自动更新功能