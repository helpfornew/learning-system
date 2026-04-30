const { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray, session } = require('electron')
const path = require('path')
const fs = require('fs')
const toolLauncher = require('./toolLauncher')

// 配置文件路径 - 支持开发环境和打包环境
// 打包后配置文件在 extraResources 中，使用 process.resourcesPath
const isPackaged = app.isPackaged
const CONFIG_PATH = isPackaged
  ? path.join(process.resourcesPath, 'config.json')
  : path.join(__dirname, 'config.json')

console.log('[Main] Environment:', isPackaged ? 'packaged' : 'development')
console.log('[Main] Config path:', CONFIG_PATH)

console.log('[Main] Process starting...')
console.log('[Main] Platform:', process.platform)
console.log('[Main] Node ENV:', process.env.NODE_ENV)

// Linux 上的配置调整 - 修复黑屏问题
if (process.platform === 'linux') {
  console.log('[Main] Configuring for Linux platform')

  // ========== 沙盒配置（必需） ==========
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-setuid-sandbox')
  app.commandLine.appendSwitch('disable-dev-shm-usage')

  // ========== GPU 配置 - 修复黑屏 ==========
  // 禁用 GPU 硬件加速，使用软件渲染避免驱动兼容性问题
  app.commandLine.appendSwitch('disable-gpu')
  // 使用 SwiftShader 软件渲染器（CPU渲染，兼容性最好）
  app.commandLine.appendSwitch('use-gl', 'swiftshader')
  // 禁用 zygote 进程（解决某些 Linux 发行版的沙盒问题）
  app.commandLine.appendSwitch('no-zygote')
  // 禁用命名空间沙盒
  app.commandLine.appendSwitch('disable-namespace-sandbox')
  // 禁用 GPU 沙盒
  app.commandLine.appendSwitch('disable-gpu-sandbox')

  // ========== 平台设置 ==========
  // Ozone 平台自动检测（Wayland/X11）
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto')

  // ========== 安全设置（用于 HTTP 本地服务器） ==========
  app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', 'http://localhost,http://127.0.0.1,http://0.0.0.0')

  // ========== 环境变量设置 ==========
  process.env.GTK_IM_MODULE = 'ibus'
  process.env.QT_IM_MODULE = 'ibus'
  process.env.XMODIFIERS = '@im=ibus'
  // 强制使用 X11 后端（Wayland 兼容性更好）
  process.env.GDK_BACKEND = 'x11'
  process.env.DISPLAY = process.env.DISPLAY || ':0'

  // 设置临时目录
  const tempDir = require('os').tmpdir()
  process.env.TMPDIR = tempDir
  process.env.TEMP = tempDir
  process.env.TMP = tempDir

  console.log('[Main] Linux configuration applied successfully')
}

let mainWindow
let quickInputWindow
let db

// 单实例锁 - 防止应用多开
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.log('[Main] Another instance is already running, quitting...')
  app.quit()
} else {
  // 当运行第二个实例时，聚焦到第一个实例的窗口
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    console.log('[Main] Second instance detected, focusing first instance window')
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      mainWindow.show()
    }
  })
}

function createWindow() {
  console.log('[Main] Creating window...')
  let windowShown = false

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // 启用摄像头和麦克风
      mediaDevices: true,
      // 禁用共享内存和 GPU 相关功能
      disableCompositedAntialiasing: true,
      // 禁用实验性特性
      experimentalFeatures: false,
      // 允许访问文件 URL
      allowRunningInsecureContent: true,
      // 允许混合内容
      allowDisplayingInsecureContent: true,
      // 启用 WebRTC（摄像头需要）
      webRTC: true,
      // 禁用同源策略（开发环境）
      webSecurity: false
    },
    show: false,
    icon: path.join(__dirname, '../resources/icons/icon.png')
  })

  // 在窗口创建后，立即设置 webContents 的参数
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    // 允许摄像头和麦克风权限
    if (permission === 'camera' || permission === 'microphone') {
      return true
    }
    return false
  })

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    // 允许摄像头和麦克风设备
    if (details.deviceType === 'camera' || details.deviceType === 'microphone') {
      return true
    }
    return false
  })

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[Main] Render process gone:', details.reason);
  });

  // 显示窗口的函数
  const showWindow = () => {
    if (!windowShown) {
      windowShown = true
      console.log('[Main] Showing window')
      mainWindow.show()
      mainWindow.focus()
    }
  }

  // 监听加载完成事件
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Page loaded')
    showWindow()
  })

  // 监听 ready-to-show 事件
  mainWindow.once('ready-to-show', () => {
    console.log('[Main] Window ready to show')
    showWindow()
  })

  // 超时备用机制：5 秒后强制显示窗口
  setTimeout(() => {
    showWindow()
  }, 5000)

  // 加载应用
  if (process.env.NODE_ENV === 'development') {
    console.log('[Main] Loading dev URL: http://localhost:5173')
    mainWindow.loadURL('http://localhost:5173')
      .then(() => console.log('[Main] Dev URL loaded successfully'))
      .catch((err) => {
        console.error('[Main] Failed to load dev URL:', err)
        console.log('[Main] Retrying...')
        setTimeout(() => {
          mainWindow.loadURL('http://localhost:5173')
            .catch(e => console.error('[Main] Retry failed:', e))
        }, 2000)
      })
  } else {
    console.log('[Main] Loading production file')
    // 生产模式：加载打包后的 dist/index.html
    // 使用 extraResources 将 dist 目录放在 app.asar 外部
    let indexPath

    // 尝试多个可能的路径
    const possiblePaths = [
      path.join(process.resourcesPath, 'dist', 'index.html'),  // extraResources 路径
      path.join(app.getAppPath(), 'dist', 'index.html'),       // 开发模式路径
      path.join(__dirname, '..', 'dist', 'index.html'),        // 备用路径
      path.join(__dirname, '../../dist', 'index.html')         // 另一种可能的路径
    ]

    console.log('[Main] App path:', app.getAppPath())
    console.log('[Main] Resources path:', process.resourcesPath)

    // 查找存在的文件
    indexPath = possiblePaths.find(p => {
      const exists = require('fs').existsSync(p)
      console.log(`[Main] Checking: ${p} - ${exists ? 'FOUND' : 'NOT FOUND'}`)
      return exists
    })

    if (indexPath) {
      console.log('[Main] Loading file:', indexPath)
      // 使用 loadURL 替代 loadFile 以更好地处理包含中文字符的路径
      const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`
      console.log('[Main] Loading URL:', fileUrl)
      mainWindow.loadURL(fileUrl)
        .then(() => console.log('[Main] Production file loaded successfully'))
        .catch((err) => {
          console.error('[Main] Failed to load production file:', err)
          // 如果URL加载失败，尝试直接loadFile
          mainWindow.loadFile(indexPath)
            .catch(e => console.error('[Main] Load file also failed:', e))
        })
    } else {
      console.error('[Main] ERROR: Could not find dist/index.html in any expected location')
      // 提供一个错误页面
      mainWindow.loadURL(`data:text/html;charset=utf-8,<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>错误 - 高考错题系统</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .error-container {
      text-align: center;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>ERROR: 资源文件缺失</h1>
    <p>找不到应用程序资源文件 (dist/index.html)</p>
    <p>请检查安装是否完整</p>
    <p><small>错误代码: RESOURCE_NOT_FOUND</small></p>
  </div>
</body>
</html>`)
    }
  }

  mainWindow.on('closed', () => {
    console.log('[Main] Window closed')
    mainWindow = null
  })

  // 数据库不在主进程初始化，使用 localStorage 在 renderer process 中管理
  db = null

  // 注册全局快捷键
  registerGlobalShortcuts()

  // 创建应用菜单
  createApplicationMenu()
}

// 创建快速录入窗口
function createQuickInputWindow() {
  if (quickInputWindow) {
    quickInputWindow.focus()
    return
  }

  quickInputWindow = new BrowserWindow({
    width: 600,
    height: 700,
    parent: mainWindow,
    modal: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  })

  quickInputWindow.loadURL(
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:5173/#/quick-input'
      : `file://${path.join(process.resourcesPath, 'app', 'dist', 'index.html')}#/quick-input`
  )

  quickInputWindow.once('ready-to-show', () => {
    quickInputWindow.show()
  })

  quickInputWindow.on('closed', () => {
    quickInputWindow = null
  })
}

// 注册全局快捷键
function registerGlobalShortcuts() {
  // F2: 打开快速录入窗口
  globalShortcut.register('F2', () => {
    createQuickInputWindow()
  })

  // F3: 开始今日复习
  globalShortcut.register('F3', () => {
    mainWindow.webContents.send('start-today-review')
  })

  // F4: 打开数据分析
  globalShortcut.register('F4', () => {
    mainWindow.webContents.send('open-data-analysis')
  })
}

// 创建应用菜单
function createApplicationMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建错题',
          accelerator: 'CmdOrCtrl+N',
          click: () => createQuickInputWindow()
        },
        { type: 'separator' },
        {
          label: '导入错题',
          submenu: [
            { label: '从Excel导入' },
            { label: '从文件夹导入' },
            { label: '从剪贴板导入' }
          ]
        },
        {
          label: '导出数据',
          submenu: [
            { label: '导出为PDF' },
            { label: '导出为Excel' },
            { label: '导出为JSON' }
          ]
        },
        { type: 'separator' },
        { label: '退出', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '刷新', accelerator: 'F5', role: 'reload' },
        { label: '开发者工具', accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '表格视图', accelerator: 'Ctrl+1', type: 'radio', checked: true },
        { label: '卡片视图', accelerator: 'Ctrl+2', type: 'radio' },
        { type: 'separator' },
        { label: '深色模式', type: 'checkbox' }
      ]
    },
    {
      label: '工具',
      submenu: [
        {
          label: '时间跟踪',
          click: () => {
            const result = toolLauncher.launchTimeTracker()
            if (mainWindow) {
              const { dialog } = require('electron')
              if (result.success) {
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: '时间跟踪',
                  message: '时间跟踪器已启动',
                  detail: `PID: ${result.pid}`
                })
              } else {
                dialog.showMessageBox(mainWindow, {
                  type: 'error',
                  title: '时间跟踪',
                  message: '启动失败',
                  detail: result.message || result.error
                })
              }
            }
          }
        },
        {
          label: '智能提醒',
          click: () => {
            const result = toolLauncher.launchSmartReminder()
            if (mainWindow) {
              const { dialog } = require('electron')
              if (result.success) {
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: '智能提醒',
                  message: '智能提醒已启动',
                  detail: `PID: ${result.pid}`
                })
              } else {
                dialog.showMessageBox(mainWindow, {
                  type: 'error',
                  title: '智能提醒',
                  message: '启动失败',
                  detail: result.message || result.error
                })
              }
            }
          }
        },
        {
          label: '数据备份',
          click: () => {
            const result = toolLauncher.launchDataBackup()
            if (mainWindow) {
              const { dialog } = require('electron')
              if (result.success) {
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: '数据备份',
                  message: '数据备份已启动',
                  detail: `PID: ${result.pid}`
                })
              } else {
                dialog.showMessageBox(mainWindow, {
                  type: 'error',
                  title: '数据备份',
                  message: '启动失败',
                  detail: result.message || result.error
                })
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: '快速查资料',
          click: () => {
            toolLauncher.launchQuickSearch()
          }
        },
        {
          label: '专注模式',
          click: () => {
            const result = toolLauncher.launchFocusMode()
            if (mainWindow && result.message) {
              const { dialog } = require('electron')
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: '专注模式',
                message: result.message
              })
            }
          }
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        { label: '快捷键说明' },
        { label: '使用教程' },
        { type: 'separator' },
        { label: '关于' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// IPC通信处理
ipcMain.handle('database:getMistakes', async (event, filters) => {
  try {
    // 从 renderer process 的 localStorage 读取
    // 实际上是从前端页面读取，通过返回空数组
    // 改为让前端直接访问 localStorage
    console.log('[IPC] getMistakes - 使用前端 localStorage');
    return [];
  } catch (error) {
    console.error('[IPC] 获取错题失败:', error);
    return [];
  }
})

ipcMain.handle('database:addMistake', async (event, mistake) => {
  try {
    console.log('[IPC] addMistake - 使用前端 localStorage');
    return { success: true };
  } catch (error) {
    console.error('[IPC] 添加错题失败:', error);
    return null;
  }
})

// 工具启动 IPC 处理器
ipcMain.handle('launchTimeTracker', () => {
  return toolLauncher.launchTimeTracker();
});

ipcMain.handle('launchSmartReminder', () => {
  return toolLauncher.launchSmartReminder();
});

ipcMain.handle('launchDataBackup', () => {
  return toolLauncher.launchDataBackup();
});

ipcMain.handle('launchFocusMode', () => {
  return toolLauncher.launchFocusMode();
});

ipcMain.handle('launchQuickSearch', () => {
  return toolLauncher.launchQuickSearch();
});

// 摄像头权限申请处理
ipcMain.handle('request-camera-permission', async () => {
  try {
    if (mainWindow) {
      // 在 Electron 中，我们需要通过系统 API 请求权限
      const { systemPreferences } = require('electron');

      // macOS 系统权限检查
      if (process.platform === 'darwin') {
        const cameraAllowed = systemPreferences.getMediaAccessStatus('camera');
        if (cameraAllowed !== 'granted') {
          const granted = await systemPreferences.askForMediaAccess('camera');
          return { success: granted, message: granted ? '权限已授予' : '权限被拒绝' };
        }
        return { success: true, message: '权限已授予' };
      }

      // Windows/Linux 直接返回成功，权限由 Chromium 处理
      return { success: true, message: '请在应用内授权摄像头访问' };
    }
    return { success: false, message: '窗口未初始化' };
  } catch (error) {
    console.error('[IPC] 请求摄像头权限失败:', error);
    return { success: false, message: error.message };
  }
});

// 服务器配置管理
ipcMain.handle('getServerConfig', () => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const config = JSON.parse(configContent);
      return {
        success: true,
        url: config.server?.url || '',
        enableCustomServer: config.server?.enableCustomServer ?? true,
        allowInsecureConnection: config.server?.allowInsecureConnection ?? false
      };
    }
    return { success: false, error: '配置文件不存在' };
  } catch (error) {
    console.error('[IPC] 读取服务器配置失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('saveServerConfig', (event, config) => {
  try {
    let currentConfig = {};
    if (fs.existsSync(CONFIG_PATH)) {
      const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
      currentConfig = JSON.parse(configContent);
    }

    // 更新服务器配置
    currentConfig.server = {
      url: config.url,
      enableCustomServer: config.enableCustomServer ?? true,
      allowInsecureConnection: config.allowInsecureConnection ?? false
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(currentConfig, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('[IPC] 保存服务器配置失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理摄像头和麦克风权限
app.whenReady().then(() => {
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'camera' || permission === 'microphone') {
      return true
    }
    return false
  })

  session.defaultSession.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'camera' || details.deviceType === 'microphone') {
      return true
    }
    return false
  })
})

// 应用生命周期
app.whenReady().then(() => {
  console.log('[Main] App ready, creating window...')
  createWindow()

  app.on('activate', () => {
    console.log('[Main] App activated')
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}).catch(error => {
  console.error('[Main] App ready error:', error)
})

app.on('window-all-closed', () => {
  console.log('[Main] All windows closed')
  if (process.platform !== 'darwin') {
    console.log('[Main] Quitting app')
    app.quit()
  }
})

app.on('will-quit', () => {
  console.log('[Main] App will quit')
  // 注销所有快捷键
  globalShortcut.unregisterAll()

  // 关闭数据库连接
  if (db) {
    console.log('[Main] Closing database')
    db.close()
  }
})

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error)
})

// 添加权限请求处理
app.on('web-contents-created', (event, contents) => {
  contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    // 自动允许摄像头和麦克风权限
    if (permission === 'camera' || permission === 'microphone') {
      callback(true)
    } else {
      callback(false)
    }
  })
})
