const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

// 统一路径配置 - 使用 learning_system 目录
const PATHS = {
  home: os.homedir(),
  tools: path.join(os.homedir(), 'learning_system/tools'),
  progress: path.join(os.homedir(), 'learning_system/progress')
}

// 获取配置文件路径 - 支持开发环境和打包环境
function getConfigPath() {
  // 在 Electron 主进程中，可以使用 process.resourcesPath
  // 但在非 Electron 环境中，回退到 __dirname
  const resourcesPath = process.resourcesPath || __dirname
  const isPackaged = resourcesPath !== __dirname
  return isPackaged
    ? path.join(resourcesPath, 'config.json')
    : path.join(__dirname, 'config.json')
}

// 初始化路径（可选，用于从配置文件覆盖）
function initPaths() {
  try {
    const configPath = getConfigPath()
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      if (config.paths) {
        // 使用配置中的路径，如果有的话
        if (config.paths.tools) {
          PATHS.tools = config.paths.tools.replace('~', os.homedir())
        }
        if (config.paths.progress) {
          PATHS.progress = config.paths.progress.replace('~', os.homedir())
        }
      }
    }
  } catch (e) {
    console.log('[ToolLauncher] 无法读取配置文件，使用默认路径')
  }

  console.log('[ToolLauncher] 工具路径:', PATHS.tools)
  console.log('[ToolLauncher] 进度路径:', PATHS.progress)
}

// 初始化路径
initPaths()

/**
 * 启动时间跟踪器
 */
function launchTimeTracker() {
  const scriptPath = path.join(PATHS.tools, 'time_tracker.py')

  if (!fs.existsSync(scriptPath)) {
    console.error('[ToolLauncher] 时间跟踪器脚本不存在:', scriptPath)
    return { success: false, message: '脚本文件不存在' }
  }

  try {
    const process = spawn('python3', [scriptPath], {
      detached: true,
      stdio: 'ignore',
      shell: true
    })

    process.unref()
    console.log('[ToolLauncher] 时间跟踪器已启动，PID:', process.pid)
    return { success: true, pid: process.pid }
  } catch (error) {
    console.error('[ToolLauncher] 启动时间跟踪器失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 启动智能提醒系统
 */
function launchSmartReminder() {
  const scriptPath = path.join(PATHS.tools, 'smart_reminder.py')

  if (!fs.existsSync(scriptPath)) {
    console.error('[ToolLauncher] 智能提醒脚本不存在:', scriptPath)
    return { success: false, message: '脚本文件不存在' }
  }

  try {
    const process = spawn('python3', [scriptPath], {
      detached: true,
      stdio: 'ignore',
      shell: true
    })

    process.unref()
    console.log('[ToolLauncher] 智能提醒已启动，PID:', process.pid)
    return { success: true, pid: process.pid }
  } catch (error) {
    console.error('[ToolLauncher] 启动智能提醒失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 启动数据备份系统
 */
function launchDataBackup() {
  const scriptPath = path.join(PATHS.tools, 'data_sync_backup.py')

  if (!fs.existsSync(scriptPath)) {
    console.error('[ToolLauncher] 数据备份脚本不存在:', scriptPath)
    return { success: false, message: '脚本文件不存在' }
  }

  try {
    const process = spawn('python3', [scriptPath], {
      detached: true,
      stdio: 'ignore',
      shell: true
    })

    process.unref()
    console.log('[ToolLauncher] 数据备份已启动，PID:', process.pid)
    return { success: true, pid: process.pid }
  } catch (error) {
    console.error('[ToolLauncher] 启动数据备份失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 启动专注模式
 */
function launchFocusMode() {
  // 专注模式可以是阻止访问某些网站或应用
  // 这里简化为启动一个全屏窗口
  console.log('[ToolLauncher] 专注模式启动')
  return { success: true, message: '专注模式已启动' }
}

/**
 * 启动快速查资料
 */
function launchQuickSearch() {
  // 打开浏览器或搜索窗口
  const { shell } = require('electron')
  shell.openExternal('https://www.baidu.com/s?wd=学习资料')
  return { success: true }
}

/**
 * 同步学习时间数据（从 Python 工具同步到 Electron）
 */
function syncStudyData() {
  const progressDbPath = path.join(PATHS.progress, '学习时间.db')

  if (!fs.existsSync(progressDbPath)) {
    console.log('[ToolLauncher] 学习时间数据库不存在')
    return { success: false, message: '学习时间数据不存在' }
  }

  // 读取 SQLite 数据库需要 better-sqlite3
  // 这里简单返回文件路径，让前端通过 IPC 读取
  console.log('[ToolLauncher] 发现学习时间数据:', progressDbPath)
  return { success: true, dbPath: progressDbPath }
}

module.exports = {
  launchTimeTracker,
  launchSmartReminder,
  launchDataBackup,
  launchFocusMode,
  launchQuickSearch,
  syncStudyData,
  initPaths
}
