const { contextBridge, ipcRenderer, shell } = require('electron')

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 数据库操作
  databaseQuery: (sql, params) => ipcRenderer.invoke('database:query', sql, params),
  databaseExecute: (sql, params) => ipcRenderer.invoke('database:execute', sql, params),
  getMistakes: (filters) => ipcRenderer.invoke('database:getMistakes', filters),
  addMistake: (mistake) => ipcRenderer.invoke('database:addMistake', mistake),
  updateMistake: (id, updates) => ipcRenderer.invoke('database:updateMistake', id, updates),
  deleteMistake: (id) => ipcRenderer.invoke('database:deleteMistake', id),
  getStatistics: () => ipcRenderer.invoke('database:getStatistics'),

  // 工具启动
  launchTimeTracker: () => ipcRenderer.invoke('launchTimeTracker'),
  launchSmartReminder: () => ipcRenderer.invoke('launchSmartReminder'),
  launchDataBackup: () => ipcRenderer.invoke('launchDataBackup'),
  launchFocusMode: () => ipcRenderer.invoke('launchFocusMode'),
  launchQuickSearch: () => ipcRenderer.invoke('launchQuickSearch'),

  // 窗口控制
  openQuickInput: () => ipcRenderer.send('open-quick-input'),
  closeQuickInput: () => ipcRenderer.send('close-quick-input'),

  // 事件监听
  onStartTodayReview: (callback) => ipcRenderer.on('start-today-review', callback),
  onOpenDataAnalysis: (callback) => ipcRenderer.on('open-data-analysis', callback),

  // 工具函数
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body),

  // 获取应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 文件操作
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  saveFile: (content, options) => ipcRenderer.invoke('save-file', content, options),

  // 服务器配置
  getServerConfig: () => ipcRenderer.invoke('getServerConfig'),
  saveServerConfig: (config) => ipcRenderer.invoke('saveServerConfig', config),

  // 打开外部链接
  openExternal: (url) => shell.openExternal(url)
})

// 暴露一些Node.js模块（安全地）
contextBridge.exposeInMainWorld('nodeModules', {
  path: {
    join: (...args) => require('path').join(...args),
    basename: (path) => require('path').basename(path),
    dirname: (path) => require('path').dirname(path)
  },
  fs: {
    readFileSync: (path, encoding) => require('fs').readFileSync(path, encoding),
    writeFileSync: (path, data) => require('fs').writeFileSync(path, data),
    existsSync: (path) => require('fs').existsSync(path)
  }
})
// 摄像头权限请求
contextBridge.exposeInMainWorld('requestCameraPermission', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(track => track.stop())
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
