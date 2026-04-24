const { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray, session } = require('electron')
const path = require('path')
const fs = require('fs')

// 配置文件路径
const CONFIG_PATH = path.join(__dirname, 'config.json')

console.log('[Main] Process starting...')
console.log('[Main] Platform:', process.platform)
console.log('[Main] Node ENV:', process.env.NODE_ENV)

// 隐藏菜单栏
Menu.setApplicationMenu(null)

// Linux 上的配置调整（谨慎禁用功能）
if (process.platform === 'linux') {
  console.log('[Main] Configuring for Linux platform')
  // 基础沙盒禁用（必需）
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-setuid-sandbox')
  app.commandLine.appendSwitch('disable-dev-shm-usage')

  // 谨慎处理GPU设置（仅在必要时禁用）
  // 如果用户遇到渲染问题，可以使用 --disable-gpu 启动参数
  // app.commandLine.appendSwitch('disable-gpu')

  // 保留GL设置以支持更好的渲染
  app.commandLine.appendSwitch('disable-gpu')
  app.commandLine.appendSwitch('use-gl', 'swiftshader')
  app.commandLine.appendSwitch('no-zygote')
  app.commandLine.appendSwitch('disable-namespaces')

  // 平台设置
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto')
  app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', 'http://localhost,http://127.0.0.1,http://0.0.0.0')
  app.commandLine.appendSwitch('enable-unsafe-web-features', 'WebMediaDevices')

  // 环境变量设置
  process.env.GTK_IM_MODULE = 'ibus'
  process.env.QT_IM_MODULE = 'ibus'
  process.env.XMODIFIERS = '@im=ibus'
  process.env.GDK_BACKEND = 'x11'
  process.env.DISPLAY = process.env.DISPLAY || ':0'

  const tempDir = require('os').tmpdir()
  process.env.TMPDIR = tempDir
  process.env.TEMP = tempDir
  process.env.TMP = tempDir
}

let mainWindow
let quickInputWindow
let db

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
      // 启用远程模块
      enableRemoteModule: false,
      // 允许混合内容
      allowDisplayingInsecureContent: true
    },
    show: false,
    fullscreen: true,  // 自动全屏
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../resources/icons/icon.png')
  })

  // 在窗口创建后，立即设置 webContents 的参数
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
    console.log('[Main] Loading dev URL: http://localhost:8080')
    mainWindow.loadURL('http://localhost:8080')
      .then(() => console.log('[Main] Dev URL loaded successfully'))
      .catch((err) => {
        console.error('[Main] Failed to load dev URL:', err)
        console.log('[Main] Retrying...')
        setTimeout(() => {
          mainWindow.loadURL('http://localhost:8080')
            .catch(e => console.error('[Main] Retry failed:', e))
        }, 2000)
      })
  } else {
    console.log('[Main] Loading production mode - 本地资源')
    // 生产模式：加载打包的本地资源
    const indexPath = path.join(__dirname, '../web_modules/config/index.html')
    console.log('[Main] Loading local file:', indexPath)
    mainWindow.loadFile(indexPath)
      .then(() => console.log('[Main] Production homepage loaded successfully'))
      .catch((err) => {
        console.error('[Main] Failed to load production homepage:', err)
        // 如果加载失败，尝试备用路径
        const fallbackPath = path.join(process.resourcesPath, 'app', 'web_modules', 'config', 'index.html')
        console.log('[Main] Trying fallback path:', fallbackPath)
        mainWindow.loadFile(fallbackPath)
          .catch(e => console.error('[Main] Fallback also failed:', e))
      })
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

// 创建快速录入窗口 - 用于错题系统
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

  // 在桌面应用环境中，错题系统可能需要不同的路径
  const mistakeUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:5173'
    : `file://${path.join(process.resourcesPath, 'app', 'dist', 'index.html')}`

  quickInputWindow.loadURL(mistakeUrl)

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

// 工具启动器（引用原始的工具启动器）
const toolLauncher = require('./toolLauncher')

// IPC通信处理
ipcMain.handle('database:getMistakes', async (event, filters) => {
  try {
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

ipcMain.handle('saveServerConfig', (config) => {
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
// 添加权限请求处理（在 app.whenReady 之前）
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
