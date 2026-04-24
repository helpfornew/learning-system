# 开发模式使用说明

## 概述

开发模式下，修改前端代码后只需刷新浏览器即可看到变化，无需重新构建。

## 原理

- Python 后端运行在开发模式（`DEV_MODE=1`）
- 所有对 `/mistake/` 的请求自动代理到 Vite 开发服务器（`http://localhost:5173`）
- Vite 提供热更新功能，修改代码后自动刷新

## 使用方法

### 方法一：双终端启动（推荐）

**终端 1 - 启动 Vite 开发服务器：**
```bash
cd mistake_system/mistake-system-desktop
npm run dev
```

**终端 2 - 启动 Python 后端（开发模式）：**
```bash
export DEV_MODE=1
export VITE_DEV_SERVER=http://localhost:5173
python3 unified_server.py
```

**或者使用启动脚本：**
```bash
./start_dev.sh
```

### 方法二：单终端启动

```bash
./start_dev_simple.sh
```

此脚本会使用 `concurrently` 同时启动 Vite 和 Python 后端。

## 访问地址

- 学习系统主页：http://localhost:8080/
- 错题系统：http://localhost:8080/mistake/
- Vite 开发服务器：http://localhost:5173/

## 工作流程

1. 启动开发服务器后，访问 http://localhost:8080/mistake/
2. 修改 `mistake_system/mistake-system-desktop/src/` 下的代码
3. Vite 自动检测变化并热更新
4. 刷新浏览器即可看到变化

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DEV_MODE` | 是否启用开发模式 | `0` |
| `VITE_DEV_SERVER` | Vite 开发服务器地址 | `http://localhost:5173` |
| `LEARNING_SYSTEM_PORT` | Python 后端端口 | `8080` |

## 生产环境

生产环境部署时，需要先构建前端：

```bash
cd mistake_system/mistake-system-desktop
npm run build
```

然后正常运行 Python 后端（不需要设置 `DEV_MODE`）：
```bash
python3 unified_server.py
```

## 注意事项

1. 开发模式下需要同时运行 Vite 和 Python 两个服务
2. 确保端口 5173 和 8080 未被占用
3. 开发模式下性能不如生产环境，仅用于开发调试
4. 生产部署必须使用 `npm run build` 构建后的静态文件
